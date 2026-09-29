import httpx
import time
import sys

BASE_URL = "http://localhost:8000/api/v1"

def print_step(msg):
    print(f"\n{'='*50}\n{msg}\n{'='*50}")

def main():
    client = httpx.Client(timeout=60.0)

    # 1. Create User/Auth (Skip? The app doesn't require explicit user creation if it's bypassable, or maybe it does?)
    # Wait, looking at the API, there might not be a user creation endpoint if we just pass a token or if auth is bypassed.
    # Let's just create an activity directly. If it fails due to auth, we'll see.
    # Actually, in development, FIREBASE_PROJECT_ID is empty, so auth is bypassed. A default user might be injected or user_id=None.

    # 2. Create Activity
    print_step("PHASE 5 — CREATE ACTIVITY")
    intent = "I am going from Delhi to Manali for 4 days by car."
    res = client.post(f"{BASE_URL}/activities", json={
        "title": "Delhi to Manali trip",
        "activity_type": "ROAD_TRIP",
        "raw_intent": intent
    })
    print(f"Status: {res.status_code}")
    print(f"Body: {res.text}")
    if res.status_code >= 400:
        sys.exit(1)
    
    activity_data = res.json()
    activity_id = activity_data["id"]
    print(f"Activity ID: {activity_id}")

    # 3. Start Plan Run
    print_step("PHASE 6 — START REAL PLAN RUN")
    res = client.post(f"{BASE_URL}/activities/{activity_id}/plan-runs")
    print(f"Status: {res.status_code}")
    print(f"Body: {res.text}")
    if res.status_code >= 400:
        sys.exit(1)
    
    plan_run_data = res.json()
    run_id = plan_run_data["id"]
    print(f"Plan Run ID: {run_id}")

    # 4. Monitor Plan Run
    print_step("PHASE 7 — MONITOR PLAN RUN")
    max_attempts = 60
    final_state = None
    for i in range(max_attempts):
        res = client.get(f"{BASE_URL}/activities/{activity_id}/plan-runs/{run_id}")
        data = res.json()
        status = data["status"]
        print(f"Attempt {i+1}: Status = {status}")
        final_state = data
        if status in ("SUCCEEDED", "FAILED", "completed", "failed"):
            break
        time.sleep(2)
    
    print(f"Final State: {final_state}")
    if final_state["status"] not in ("SUCCEEDED", "completed"):
        print("Plan run did not complete successfully.")
        sys.exit(1)
    
    plan_id = final_state.get("plan_id")
    if not plan_id:
        print("No plan_id returned!")
        sys.exit(1)
    print(f"Generated Plan ID: {plan_id}")

    # 5. Fetch Plan
    print_step("PHASE 12 — VERIFY GENERATED PLAN")
    res = client.get(f"{BASE_URL}/plans/{plan_id}")
    print(f"Plan Fetch Status: {res.status_code}")
    plan_data = res.json()
    print("Plan Data Keys:", plan_data.keys())
    print("Sections:", len(plan_data.get("sections", [])))
    print("Tasks:", sum(len(s.get("tasks", [])) for s in plan_data.get("sections", [])))
    
    # 6. Verify Task System & Next Action
    print_step("PHASE 13 & 19 — VERIFY TASK SYSTEM & NEXT ACTION")
    res = client.get(f"{BASE_URL}/plans/{plan_id}/next-action")
    print("Next action fetch:", res.status_code)
    next_action_data = res.json()
    task = next_action_data.get("task")
    
    if task:
        task_id = task["id"]
        print(f"Completing task {task_id}...")
        res = client.post(f"{BASE_URL}/tasks/{task_id}/complete")
        print("Complete status:", res.status_code)
        
        print(f"Reopening task {task_id}...")
        res = client.post(f"{BASE_URL}/tasks/{task_id}/reopen")
        print("Reopen status:", res.status_code)
    else:
        print("No tasks generated or available!")

    # 7. Route and Places
    print_step("PHASES 16 & 17 — VERIFY ROUTE & PLACES API")
    res = client.get(f"{BASE_URL}/plans/{plan_id}/places")
    print(f"Places status: {res.status_code}, count: {len(res.json()) if res.status_code == 200 else 0}")
    
    res = client.get(f"{BASE_URL}/plans/{plan_id}/route")
    print(f"Route status: {res.status_code}")
    
    # 8. Packing and Itinerary
    print_step("PHASES 14 & 15 — VERIFY PACKING & ITINERARY")
    res = client.get(f"{BASE_URL}/plans/{plan_id}/packing")
    print(f"Packing status: {res.status_code}, count: {len(res.json()) if res.status_code == 200 else 0}")
    
    res = client.get(f"{BASE_URL}/plans/{plan_id}/itinerary")
    print(f"Itinerary status: {res.status_code}, count: {len(res.json()) if res.status_code == 200 else 0}")

    # Wait, the prompt says "GET /plans/{id}/route". Let's check if it exists.
    # Actually, in the README: There is no GET /plans/{id}/route.
    # Ah, README says: "GET /api/v1/plans/{id} -> Get plan with sections and tasks". Wait, no, maybe the route is inside the plan itself? Let's check the keys.
    # Phase 12 checking keys should reveal it.

if __name__ == "__main__":
    main()
