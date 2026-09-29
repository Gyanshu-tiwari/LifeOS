"""
Evaluation harness for LIFEOS agents.

Runs golden scenarios against the real AI pipeline and measures:
  - Schema validity (>= 95%)
  - Feature prediction accuracy
  - Dependency validity (100%)
  - Task minimums met
  - Forbidden assumptions not present

Usage:
    # Run against real Gemini API (requires GEMINI_API_KEY):
    uv run python tests/evaluation/run_eval.py

    # Run specific scenario IDs:
    uv run python tests/evaluation/run_eval.py --ids travel_001,interview_001

    # Dry run (schema-only, no API calls):
    uv run python tests/evaluation/run_eval.py --dry-run

Results are written to tests/evaluation/results/latest.json
"""

import argparse
import asyncio
import json
import os
import sys
import time
import traceback
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

# Ensure src is on path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "src"))

from tests.evaluation.golden_scenarios import GOLDEN_SCENARIOS


# ─── Metric accumulators ──────────────────────────────────────────────────── #

class EvalMetrics:
    def __init__(self):
        self.total = 0
        self.schema_valid = 0
        self.feature_correct = 0
        self.dependency_valid = 0
        self.task_min_met = 0
        self.no_forbidden = 0
        self.errors = 0

    def pct(self, numerator: int) -> float:
        return round(numerator / self.total * 100, 1) if self.total > 0 else 0.0

    def summary(self) -> dict[str, Any]:
        return {
            "total_scenarios": self.total,
            "schema_validity_pct": self.pct(self.schema_valid),
            "feature_accuracy_pct": self.pct(self.feature_correct),
            "dependency_validity_pct": self.pct(self.dependency_valid),
            "task_min_met_pct": self.pct(self.task_min_met),
            "no_forbidden_pct": self.pct(self.no_forbidden),
            "error_rate_pct": self.pct(self.errors),
            "targets": {
                "schema_validity": ">= 95%",
                "dependency_validity": "100%",
                "task_actionability": ">= 90%",
            },
            "timestamp": datetime.now(tz=timezone.utc).isoformat(),
        }


# ─── Validators ───────────────────────────────────────────────────────────── #

def validate_schema(context: Any, plan: Any) -> tuple[bool, list[str]]:
    """Validate that agent outputs have required fields."""
    issues = []
    if context is None:
        issues.append("understanding agent returned None")
    if plan is None:
        issues.append("planner agent returned None")
    elif not plan.sections:
        issues.append("plan has no sections")
    elif not any(s.tasks for s in plan.sections):
        issues.append("plan has no tasks in any section")
    return len(issues) == 0, issues


def validate_features(context: Any, scenario: dict) -> tuple[bool, list[str]]:
    """Check expected feature flags match the understanding output."""
    issues = []
    expected = scenario.get("expected_features", {})
    for flag, expected_val in expected.items():
        actual_val = getattr(context, flag, None)
        if actual_val != expected_val:
            issues.append(f"{flag}: expected {expected_val}, got {actual_val}")
    return len(issues) == 0, issues


def validate_dependencies(plan: Any) -> tuple[bool, list[str]]:
    """Check that no section has circular dependencies in tasks."""
    issues = []
    for section in plan.sections:
        title_set = {t.title for t in section.tasks}
        for task in section.tasks:
            for dep_title in task.depends_on_titles:
                if dep_title not in title_set:
                    issues.append(
                        f"Section '{section.title}': task '{task.title}' depends on "
                        f"non-existent task '{dep_title}'"
                    )
    return len(issues) == 0, issues


def validate_task_min(plan: Any, min_tasks: int) -> tuple[bool, list[str]]:
    total_tasks = sum(len(s.tasks) for s in plan.sections)
    if total_tasks < min_tasks:
        return False, [f"Expected >= {min_tasks} tasks, got {total_tasks}"]
    return True, []


def validate_no_forbidden(context: Any, plan: Any, forbidden: list[str]) -> tuple[bool, list[str]]:
    """Check that forbidden assumptions don't appear in the plan."""
    issues = []
    if not forbidden:
        return True, []
    all_text = " ".join([
        context.summary or "",
        *context.assumptions,
        *[t.title for s in plan.sections for t in s.tasks],
    ]).lower()
    for word in forbidden:
        if word.lower() in all_text:
            issues.append(f"Forbidden term '{word}' found in output")
    return len(issues) == 0, issues


# ─── Runner ───────────────────────────────────────────────────────────────── #

async def run_scenario(scenario: dict, dry_run: bool = False) -> dict[str, Any]:
    """Run a single scenario and return evaluation result."""
    from lifeos.agents.activity_understanding import understand_activity
    from lifeos.agents.planner import generate_plan

    start = time.monotonic()
    result = {
        "id": scenario["id"],
        "category": scenario["category"],
        "raw_intent": scenario["raw_intent"],
        "schema_valid": False,
        "feature_correct": False,
        "dependency_valid": False,
        "task_min_met": False,
        "no_forbidden": False,
        "error": None,
        "issues": [],
        "latency_ms": 0,
        "task_count": 0,
    }

    if dry_run:
        result["schema_valid"] = True
        result["note"] = "dry_run: skipped API calls"
        return result

    try:
        context = await understand_activity(
            raw_intent=scenario["raw_intent"],
            activity_type=scenario.get("activity_type", ""),
            origin=scenario.get("origin"),
            destination=scenario.get("destination"),
            travel_mode=scenario.get("travel_mode"),
        )

        plan = await generate_plan(context)

        latency_ms = int((time.monotonic() - start) * 1000)
        result["latency_ms"] = latency_ms

        # Schema validation
        schema_ok, schema_issues = validate_schema(context, plan)
        result["schema_valid"] = schema_ok
        result["issues"].extend(schema_issues)

        if schema_ok:
            # Feature validation
            feat_ok, feat_issues = validate_features(context, scenario)
            result["feature_correct"] = feat_ok
            result["issues"].extend(feat_issues)

            # Dependency validation
            dep_ok, dep_issues = validate_dependencies(plan)
            result["dependency_valid"] = dep_ok
            result["issues"].extend(dep_issues)

            # Task minimum
            min_tasks = scenario.get("min_tasks", 1)
            task_ok, task_issues = validate_task_min(plan, min_tasks)
            result["task_min_met"] = task_ok
            result["issues"].extend(task_issues)
            result["task_count"] = sum(len(s.tasks) for s in plan.sections)

            # Forbidden assumptions
            forb_ok, forb_issues = validate_no_forbidden(
                context, plan, scenario.get("forbidden_assumptions", [])
            )
            result["no_forbidden"] = forb_ok
            result["issues"].extend(forb_issues)

    except Exception as exc:
        result["error"] = str(exc)
        result["traceback"] = traceback.format_exc()

    return result


async def run_eval(scenario_ids: list[str] | None = None, dry_run: bool = False):
    """Run evaluation across all (or filtered) golden scenarios."""
    scenarios = GOLDEN_SCENARIOS
    if scenario_ids:
        scenarios = [s for s in scenarios if s["id"] in scenario_ids]

    print(f"\n{'='*60}")
    print(f"LIFEOS Agent Evaluation — {len(scenarios)} scenarios")
    print(f"Dry run: {dry_run}")
    print(f"{'='*60}\n")

    metrics = EvalMetrics()
    results = []

    for scenario in scenarios:
        print(f"  [{scenario['id']}] {scenario['raw_intent'][:60]}...")
        result = await run_scenario(scenario, dry_run=dry_run)
        results.append(result)
        metrics.total += 1

        if result["error"]:
            metrics.errors += 1
            print(f"    ✗ ERROR: {result['error'][:80]}")
            continue

        if result["schema_valid"]:
            metrics.schema_valid += 1
        if result["feature_correct"]:
            metrics.feature_correct += 1
        if result["dependency_valid"]:
            metrics.dependency_valid += 1
        if result["task_min_met"]:
            metrics.task_min_met += 1
        if result["no_forbidden"]:
            metrics.no_forbidden += 1

        status = "✓" if result["schema_valid"] else "✗"
        print(
            f"    {status} tasks={result['task_count']} "
            f"latency={result['latency_ms']}ms "
            f"issues={len(result['issues'])}"
        )
        for issue in result["issues"]:
            print(f"       ⚠ {issue}")

    summary = metrics.summary()
    print(f"\n{'='*60}")
    print("EVALUATION SUMMARY")
    print(f"{'='*60}")
    for k, v in summary.items():
        if k not in ("targets", "timestamp"):
            print(f"  {k}: {v}")
    print(f"\nTargets:")
    for k, v in summary["targets"].items():
        print(f"  {k}: {v}")

    # Write results
    out_dir = Path(__file__).parent / "results"
    out_dir.mkdir(exist_ok=True)
    out_file = out_dir / "latest.json"
    with open(out_file, "w") as f:
        json.dump({"summary": summary, "results": results}, f, indent=2)
    print(f"\nResults written to: {out_file}")

    return summary


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="LIFEOS Agent Evaluation Harness")
    parser.add_argument("--ids", help="Comma-separated scenario IDs to run")
    parser.add_argument("--dry-run", action="store_true", help="Skip API calls")
    args = parser.parse_args()

    ids = args.ids.split(",") if args.ids else None
    asyncio.run(run_eval(scenario_ids=ids, dry_run=args.dry_run))
