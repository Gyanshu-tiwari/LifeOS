"""
Plan Orchestrator — drives the AI pipeline for plan generation.

Flow:
  1. Create PlanRun (QUEUED → RUNNING)
  2. Activity Understanding Agent
  3. Planner Agent (with optional Maps/Places context in Phase 6)
  4. Validate plan output
  5. Persist Plan, Sections, Tasks, PackingItems, ItineraryItems
  6. Link PlanRun → Plan
  7. Mark PlanRun SUCCEEDED (or FAILED)

Key rules:
- AI output is treated as untrusted input
- Never partially mark a plan READY
- Persist the run record even when generation fails
- All database writes go through repositories
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from lifeos.agents.activity_understanding import understand_activity
from lifeos.agents.planner import PlannerOutput, generate_plan
from lifeos.core.config import settings
from lifeos.core.exceptions import AIOutputError, NotFoundError
from lifeos.core.logging import get_logger, plan_run_id_var
from lifeos.db.models.activity import Activity
from lifeos.db.models.itinerary_item import ItineraryItem
from lifeos.db.models.packing_item import PackingItem
from lifeos.db.models.plan import Plan
from lifeos.db.models.plan_run import PlanRun
from lifeos.db.models.plan_section import PlanSection
from lifeos.db.models.task import Task, TaskDependency
from lifeos.repositories.activity import ActivityRepository
from lifeos.repositories.plan import PlanRepository
from lifeos.repositories.task import TaskRepository
from lifeos.services.evidence_service import EvidenceService
from lifeos.services.tool_call_recorder import record_tool_call

logger = get_logger(__name__)


class PlanOrchestrator:
    """
    Orchestrates the multi-agent planning pipeline.

    Manages PlanRun lifecycle and persists validated plan output.
    """

    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._plan_repo = PlanRepository(db)
        self._task_repo = TaskRepository(db)
        self._activity_repo = ActivityRepository(db)

    async def create_plan_run(
        self,
        activity: Activity,
        idempotency_key: str | None = None,
    ) -> PlanRun:
        """Create a new PlanRun record in QUEUED state."""
        run = PlanRun(
            activity_id=activity.id,
            status="QUEUED",
            model=settings.gemini_model,
            prompt_version="v1",
            idempotency_key=idempotency_key,
        )
        self._db.add(run)
        await self._db.flush()
        await self._db.refresh(run)
        return run

    async def run(
        self,
        activity_id: uuid.UUID,
        user_id: uuid.UUID,
        idempotency_key: str | None = None,
    ) -> PlanRun:
        """
        Execute the full plan generation pipeline.

        Returns the PlanRun with final status (SUCCEEDED or FAILED).
        The run record is always persisted, even on failure.
        """
        # Load activity with ownership check
        activity = await self._activity_repo.get_by_id_and_user(
            activity_id, user_id
        )
        if activity is None:
            raise NotFoundError(f"Activity {activity_id} not found")

        # Create the run record
        run = await self.create_plan_run(activity, idempotency_key)
        plan_run_id_var.set(str(run.id))

        logger.info(
            "Plan run starting",
            run_id=str(run.id),
            activity_id=str(activity_id),
            model=settings.gemini_model,
        )

        run.status = "RUNNING"
        run.started_at = datetime.now(tz=timezone.utc)
        await self._db.flush()

        try:
            plan = await self._execute_pipeline(activity, run)
            run.status = "SUCCEEDED"
            run.plan_id = plan.id
            await self._db.flush()
            logger.info(
                "Plan run succeeded",
                run_id=str(run.id),
                plan_id=str(plan.id),
            )

        except Exception as exc:
            run.status = "FAILED"
            run.error_code = type(exc).__name__
            run.error_message = str(exc)[:1000]
            await self._db.flush()
            logger.error(
                "Plan run failed",
                run_id=str(run.id),
                error=str(exc),
                error_type=type(exc).__name__,
            )

        run.finished_at = datetime.now(tz=timezone.utc)
        await self._db.flush()
        await self._db.refresh(run)
        # Final commit is handled by get_db() dependency in the route

        return run


    async def _execute_pipeline(
        self, activity: Activity, run: PlanRun
    ) -> Plan:
        """Internal: run agents, validate, persist."""
        evidence = EvidenceService(self._db, run.id)

        # Record user-provided facts as highest-trust evidence
        await evidence.record_user_fact(
            claim=activity.raw_intent,
            metadata={"activity_id": str(activity.id)},
        )
        if activity.origin_text:
            await evidence.record_user_fact(f"Origin: {activity.origin_text}")
        if activity.destination_text:
            await evidence.record_user_fact(f"Destination: {activity.destination_text}")

        # ── Step 1: Activity Understanding ────────────────────────────────── #
        async with record_tool_call(
            self._db, run.id, "activity_understanding", provider="gemini",
            request_data={"raw_intent": activity.raw_intent}
        ) as tc:
            context = await understand_activity(
                raw_intent=activity.raw_intent,
                activity_type=activity.activity_type,
                origin=activity.origin_text,
                destination=activity.destination_text,
                travel_mode=activity.travel_mode,
                start_at=str(activity.start_at) if activity.start_at else None,
                end_at=str(activity.end_at) if activity.end_at else None,
                constraints=activity.constraints_json,
            )
            tc.set_response_summary({
                "activity_type": context.activity_type,
                "confidence": context.confidence,
                "assumptions": len(context.assumptions),
            })

        # Record inferences from understanding
        for assumption in context.assumptions:
            await evidence.record_inference(claim=assumption)

        # ── Step 2: Maps/Places context (gracefully optional) ─────────────── #
        from lifeos.agents.maps import get_route_context
        from lifeos.agents.recommendation import get_recommended_places
        route_summary = None
        places_summary = []

        if context.needs_route and context.origin and context.destination:
            async with record_tool_call(
                self._db, run.id, "compute_route", provider="google_maps",
                request_data={"origin": context.origin, "destination": context.destination}
            ) as tc:
                route_summary = await get_route_context(context)
                if route_summary:
                    tc.set_response_summary({
                        "distance_meters": route_summary.get("distance_meters"),
                        "duration_seconds": route_summary.get("duration_seconds"),
                    })
                    await evidence.record_provider(
                        claim=f"Route from {context.origin} to {context.destination}: "
                              f"{route_summary.get('distance_meters', 0)//1000}km, "
                              f"{route_summary.get('duration_seconds', 0)//60}min",
                        source_uri="google_maps_directions",
                        title="Route computation",
                        relevance="high",
                    )

        if context.needs_places and context.destination:
            async with record_tool_call(
                self._db, run.id, "search_places", provider="google_places",
                request_data={"destination": context.destination}
            ) as tc:
                places_summary = await get_recommended_places(context, route_summary)
                tc.set_response_summary({"places_found": len(places_summary)})
                for p in places_summary:
                    await evidence.record_provider(
                        claim=f"Place: {p.get('name')} at {p.get('formatted_address')}",
                        source_uri=f"google_places:{p.get('provider_place_id')}",
                        title=p.get("name"),
                        relevance="medium",
                    )

        # ── Step 3: Generate Plan ──────────────────────────────────────────── #
        async with record_tool_call(
            self._db, run.id, "plan_generation", provider="gemini",
            request_data={"activity_type": context.activity_type}
        ) as tc:
            planner_output = await generate_plan(context, route_summary, places_summary)
            tc.set_response_summary({
                "sections": len(planner_output.sections),
                "total_tasks": sum(len(s.tasks) for s in planner_output.sections),
                "packing_items": len(planner_output.packing_items),
                "itinerary_items": len(planner_output.itinerary_items),
            })

        # ── Step 4: Persist the plan ───────────────────────────────────────── #
        plan = await self._persist_plan(activity, run, planner_output, route_summary, places_summary)
        return plan

    async def _persist_plan(
        self,
        activity: Activity,
        run: PlanRun,
        output: PlannerOutput,
        route_summary: dict | None = None,
        places_summary: list[dict] | None = None,
    ) -> Plan:
        """
        Persist the validated plan output.

        Uses a single transaction — either everything is persisted or nothing.
        The plan starts in GENERATING state and is set to READY only when complete.
        """
        from lifeos.repositories.place import PlaceRepository
        from lifeos.repositories.route import RouteRepository
        place_repo = PlaceRepository(self._db)
        route_repo = RouteRepository(self._db)

        # Create plan record
        plan = Plan(
            activity_id=activity.id,
            title=output.title,
            status="GENERATING",
            version=await self._next_version(activity.id),
            created_from_run_id=run.id,
        )
        self._db.add(plan)
        await self._db.flush()

        # ── Persist provider places first to get their DB IDs ────────────── #
        provider_id_to_place_id = {}
        if places_summary:
            for idx, place_data in enumerate(places_summary):
                if not place_data.get("provider_place_id"):
                    continue
                try:
                    place = await place_repo.upsert_place({
                        "provider": place_data.get("provider", "google"),
                        "provider_place_id": place_data["provider_place_id"],
                        "name": place_data.get("name"),
                        "formatted_address": place_data.get("formatted_address"),
                        "latitude": place_data.get("latitude"),
                        "longitude": place_data.get("longitude"),
                        "primary_type": place_data.get("primary_type"),
                        "rating": place_data.get("rating"),
                        "website_uri": place_data.get("website_uri"),
                        "phone": place_data.get("phone"),
                    })
                    await place_repo.link_to_plan(
                        plan_id=plan.id,
                        place_id=place.id,
                        role="point_of_interest",
                    )
                    provider_id_to_place_id[place_data["provider_place_id"]] = place.id
                except Exception:
                    pass  # Never let place persistence break the plan

        # Create sections and tasks
        for section_data in sorted(output.sections, key=lambda s: s.order_index):
            section = PlanSection(
                plan_id=plan.id,
                title=section_data.title,
                section_type=section_data.section_type,
                order_index=section_data.order_index,
            )
            self._db.add(section)
            await self._db.flush()

            # Create tasks — two passes: first create, then link dependencies
            title_to_task: dict[str, Task] = {}
            for task_data in section_data.tasks:
                metadata = None
                if task_data.provider_place_id and task_data.provider_place_id in provider_id_to_place_id:
                    metadata = {"place_id": str(provider_id_to_place_id[task_data.provider_place_id])}
                    
                task = Task(
                    plan_section_id=section.id,
                    title=task_data.title,
                    description=task_data.description,
                    priority=task_data.priority,
                    estimated_minutes=task_data.estimated_minutes,
                    status="TODO",
                    source="ai_generated",
                    metadata_json=metadata,
                )
                self._db.add(task)
                await self._db.flush()
                title_to_task[task_data.title] = task

            # Second pass: create dependency edges
            for task_data in section_data.tasks:
                if not task_data.depends_on_titles:
                    continue
                task = title_to_task[task_data.title]
                for dep_title in task_data.depends_on_titles:
                    dep_task = title_to_task.get(dep_title)
                    if dep_task and dep_task.id != task.id:
                        dep = TaskDependency(
                            task_id=task.id, depends_on_id=dep_task.id
                        )
                        self._db.add(dep)

        # Create packing items
        for pi_data in output.packing_items:
            pi = PackingItem(
                plan_id=plan.id,
                item=pi_data.item,
                category=pi_data.category,
                priority=pi_data.priority,
                reason=pi_data.reason,
            )
            self._db.add(pi)

        # Create itinerary items
        for idx, ii_data in enumerate(output.itinerary_items):
            place_id = None
            if ii_data.provider_place_id and ii_data.provider_place_id in provider_id_to_place_id:
                place_id = provider_id_to_place_id[ii_data.provider_place_id]
                
            ii = ItineraryItem(
                plan_id=plan.id,
                title=ii_data.title,
                description=ii_data.description,
                order_index=idx,
                status="PENDING",
                place_id=place_id,
            )
            self._db.add(ii)

        # ── Persist computed route ───────────────────────────────────────── #
        if route_summary:
            try:
                await route_repo.create_route(plan.id, {
                    "origin_text": route_summary.get("origin_text"),
                    "destination_text": route_summary.get("destination_text"),
                    "travel_mode": route_summary.get("travel_mode"),
                    "distance_meters": route_summary.get("distance_meters"),
                    "duration_seconds": route_summary.get("duration_seconds"),
                    "polyline": route_summary.get("polyline"),
                    "provider": route_summary.get("provider", "google"),
                })
            except Exception:
                pass  # Never let route persistence break the plan

        # Final flush + mark plan as READY
        await self._db.flush()
        plan.status = "READY"
        await self._db.flush()

        return plan

    async def _next_version(self, activity_id: uuid.UUID) -> int:
        """Return next plan version number for this activity."""
        existing = await self._plan_repo.get_plans_for_activity(activity_id)
        return len(existing) + 1
