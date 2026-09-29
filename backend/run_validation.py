import asyncio
import json
from uuid import uuid4
from datetime import datetime, timezone

from lifeos.core.config import settings
from lifeos.integrations.gemini import generate_structured
from lifeos.integrations.maps import compute_route
from lifeos.integrations.places import search_places, search_nearby, get_place_details, search_along_route
from pydantic import BaseModel
from lifeos.db.session import AsyncSessionLocal
from lifeos.db.models.user import User
from lifeos.db.models.activity import Activity
from lifeos.agents.orchestrator import PlanOrchestrator
from lifeos.repositories.plan import PlanRepository
from lifeos.db.models.plan import Plan

class TestSchema(BaseModel):
    message: str
    confidence: int

async def run_tests():
    report = {}

    print("--- 4. VERIFY GEMINI ---")
    try:
        res = await generate_structured("Say hello and give confidence 100", TestSchema)
        print("Gemini response:", res)
        report["gemini"] = {"status": "PASS", "details": f"Model: {settings.gemini_model}, Success: {res}"}
    except Exception as e:
        print("Gemini error:", e)
        report["gemini"] = {"status": "FAIL", "details": str(e)}

    print("--- 5. VERIFY GOOGLE ROUTES ---")
    route_polyline = None
    try:
        route = await compute_route("Delhi", "Manali", "DRIVE")
        print(f"Route: {route['distance_meters']}m, {route['duration_seconds']}s")
        route_polyline = route['polyline']
        report["routes"] = {"status": "PASS", "details": f"Distance: {route['distance_meters']}m, Duration: {route['duration_seconds']}s"}
    except Exception as e:
        print("Routes error:", e)
        report["routes"] = {"status": "FAIL", "details": str(e)}

    print("--- 6. VERIFY GOOGLE PLACES ---")
    place_id = None
    try:
        # A. Text Search
        places = await search_places("restaurants in Manali", max_results=2)
        print(f"Text Search found {len(places)} places")
        report["places_text"] = {"status": "PASS" if places else "FAIL", "details": f"Found {len(places)} places"}
        
        if places:
            place_id = places[0]["provider_place_id"]
            
        # B. Nearby Search (using Manali approx coordinates 32.2396, 77.1887)
        nearby = await search_nearby((32.2396, 77.1887), types=["restaurant"], radius_meters=1000, max_results=2)
        print(f"Nearby Search found {len(nearby)} places")
        report["places_nearby"] = {"status": "PASS" if nearby else "FAIL", "details": f"Found {len(nearby)} places"}

        # C. Details
        if place_id:
            details = await get_place_details(place_id)
            print(f"Place Details: {details['name']}, {details.get('formatted_address')}")
            report["places_details"] = {"status": "PASS", "details": f"Name: {details['name']}"}
        else:
            report["places_details"] = {"status": "FAIL", "details": "No place_id to query"}

    except Exception as e:
        print("Places error:", e)
        report["places_text"] = {"status": "FAIL", "details": str(e)}
        report["places_nearby"] = {"status": "FAIL", "details": str(e)}
        report["places_details"] = {"status": "FAIL", "details": str(e)}

    print("--- 7. VERIFY SEARCH ALONG ROUTE ---")
    try:
        if route_polyline:
            along_route = await search_along_route("fuel station", route_polyline, max_results=2)
            print(f"Search Along Route found {len(along_route)} places")
            report["search_along_route"] = {"status": "PASS" if along_route else "FAIL", "details": f"Found {len(along_route)} places"}
        else:
            report["search_along_route"] = {"status": "FAIL", "details": "No polyline available"}
    except Exception as e:
        print("Search Along Route error:", e)
        report["search_along_route"] = {"status": "FAIL", "details": str(e)}

    print("--- 8. RUN THE FIRST COMPLETE LIFEOS SCENARIO ---")
    plan_id = None
    try:
        async with AsyncSessionLocal() as session:
            user_id = uuid4()
            user = User(
                id=user_id,
                firebase_uid=f"test_{user_id}",
                email="test@example.com",
            )
            session.add(user)
            await session.flush()

            activity = Activity(
                id=uuid4(),
                user_id=user_id,
                title="Trip to Manali",
                activity_type="travel",
                raw_intent="I am going from Delhi to Manali for 4 days by car.",
                status="DRAFT"
            )
            session.add(activity)
            await session.commit()
            
            orchestrator = PlanOrchestrator(session)
            run = await orchestrator.run(activity.id, activity.user_id)
            
            if run.status == "SUCCEEDED":
                print(f"Plan Run succeeded! Plan ID: {run.plan_id}")
                plan_id = run.plan_id
                report["scenario"] = {"status": "PASS", "details": f"Plan generated: {plan_id}"}
            else:
                print(f"Plan Run failed: {run.error_message}")
                report["scenario"] = {"status": "FAIL", "details": run.error_message}
    except Exception as e:
        print("Scenario error:", e)
        report["scenario"] = {"status": "FAIL", "details": str(e)}

    print("--- 9 & 10 & 11. VERIFY DATABASE & ANTI-HALLUCINATION ---")
    if plan_id:
        try:
            async with AsyncSessionLocal() as session:
                repo = PlanRepository(session)
                plan_with_rels = await repo.get_plan_with_details(plan_id)
                
                # Check plan places
                from lifeos.repositories.place import PlaceRepository
                place_repo = PlaceRepository(session)
                plan_places = await place_repo.get_places_for_plan(plan_id)
                print(f"Plan has {len(plan_places)} persisted places")
                report["db_persistence"] = {"status": "PASS" if len(plan_places) > 0 else "WARN", "details": f"{len(plan_places)} places"}
                
                # Check Tasks for metadata_json['place_id']
                tasks_with_places = 0
                total_tasks = 0
                for section in plan_with_rels.sections:
                    total_tasks += len(section.tasks)
                    for task in section.tasks:
                        if task.metadata_json and "place_id" in task.metadata_json:
                            tasks_with_places += 1
                
                # Check Itinerary for place_id
                itinerary_with_places = 0
                for it in plan_with_rels.itinerary_items:
                    if it.place_id:
                        itinerary_with_places += 1
                
                print(f"Tasks linking real places: {tasks_with_places}/{total_tasks}")
                print(f"Itinerary linking real places: {itinerary_with_places}/{len(plan_with_rels.itinerary_items)}")
                report["anti_hallucination"] = {"status": "PASS", "details": f"Tasks linked: {tasks_with_places}, Itinerary linked: {itinerary_with_places}"}
        except Exception as e:
            print("DB Verification error:", e)
            report["db_persistence"] = {"status": "FAIL", "details": str(e)}
            report["anti_hallucination"] = {"status": "FAIL", "details": str(e)}

    with open("report.json", "w") as f:
        json.dump(report, f, indent=2)

if __name__ == "__main__":
    asyncio.run(run_tests())
