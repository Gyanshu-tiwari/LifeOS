"""
Golden scenario dataset for LIFEOS agent evaluation.

Categories from the dossier:
  travel, appointment, college/institution visit, interview,
  relocation, shopping, event, conference, custom

Each scenario has:
  - raw_intent: user's natural language input
  - activity_type: expected classification
  - expected_features: flags that must be true in understanding output
  - forbidden_assumptions: things the model must NOT assume
  - expected_plan_sections: section types expected in the plan
  - dependency_rules: task dependency constraints that must hold
"""

GOLDEN_SCENARIOS = [
    # ── Travel ────────────────────────────────────────────────────────── #
    {
        "id": "travel_001",
        "category": "travel",
        "raw_intent": "I want to drive from Delhi to Manali next weekend for a 5-day trip.",
        "activity_type": "travel",
        "origin": "Delhi",
        "destination": "Manali",
        "travel_mode": "DRIVE",
        "expected_features": {
            "needs_route": True,
            "needs_packing_list": True,
            "needs_itinerary": True,
        },
        "expected_plan_sections": ["preparation", "journey"],
        "min_tasks": 5,
        "forbidden_assumptions": ["flight"],
    },
    {
        "id": "travel_002",
        "category": "travel",
        "raw_intent": "Book a flight to Goa for a 3-day beach holiday in December.",
        "activity_type": "travel",
        "destination": "Goa",
        "expected_features": {
            "needs_packing_list": True,
            "needs_itinerary": True,
        },
        "expected_plan_sections": ["preparation"],
        "min_tasks": 4,
        "forbidden_assumptions": [],
    },
    {
        "id": "travel_003",
        "category": "travel",
        "raw_intent": "I need to take my family (2 adults, 3 kids) from Bangalore to Kerala by train.",
        "activity_type": "travel",
        "origin": "Bangalore",
        "destination": "Kerala",
        "expected_features": {
            "needs_packing_list": True,
        },
        "expected_plan_sections": ["preparation"],
        "min_tasks": 4,
        "forbidden_assumptions": ["flight", "drive"],
    },

    # ── Appointment ───────────────────────────────────────────────────── #
    {
        "id": "appointment_001",
        "category": "appointment",
        "raw_intent": "I have a doctor's appointment at AIIMS Delhi tomorrow at 10am.",
        "activity_type": "appointment",
        "expected_features": {
            "has_time_constraint": True,
        },
        "expected_plan_sections": ["preparation"],
        "min_tasks": 2,
        "forbidden_assumptions": [],
    },
    {
        "id": "appointment_002",
        "category": "appointment",
        "raw_intent": "Dentist visit next Tuesday afternoon. Need to leave from Noida.",
        "activity_type": "appointment",
        "origin": "Noida",
        "expected_features": {
            "has_time_constraint": True,
        },
        "expected_plan_sections": ["preparation"],
        "min_tasks": 2,
        "forbidden_assumptions": [],
    },

    # ── Interview ─────────────────────────────────────────────────────── #
    {
        "id": "interview_001",
        "category": "interview",
        "raw_intent": "I have a job interview at Google Hyderabad office this Friday at 2pm. I'm coming from Pune.",
        "activity_type": "interview",
        "origin": "Pune",
        "destination": "Hyderabad",
        "expected_features": {
            "has_time_constraint": True,
            "needs_packing_list": True,
        },
        "expected_plan_sections": ["preparation"],
        "min_tasks": 5,
        "forbidden_assumptions": [],
    },
    {
        "id": "interview_002",
        "category": "interview",
        "raw_intent": "Technical interview at Amazon tomorrow morning, online from home. Need to prepare DSA and system design.",
        "activity_type": "interview",
        "expected_features": {
            "has_time_constraint": True,
            "needs_route": False,
        },
        "expected_plan_sections": ["preparation"],
        "min_tasks": 3,
        "forbidden_assumptions": ["travel"],
    },

    # ── College/Institution Visit ──────────────────────────────────────── #
    {
        "id": "college_001",
        "category": "college_visit",
        "raw_intent": "I'm visiting IIT Bombay campus next week for admission counselling. I'm from Jaipur.",
        "activity_type": "travel",
        "origin": "Jaipur",
        "destination": "IIT Bombay",
        "expected_features": {
            "needs_route": True,
            "needs_packing_list": True,
        },
        "expected_plan_sections": ["preparation", "journey"],
        "min_tasks": 4,
        "forbidden_assumptions": [],
    },

    # ── Shopping ──────────────────────────────────────────────────────── #
    {
        "id": "shopping_001",
        "category": "shopping",
        "raw_intent": "I need to buy a laptop, a bag, and some stationery before my college semester starts next week.",
        "activity_type": "shopping",
        "expected_features": {
            "needs_places": True,
        },
        "expected_plan_sections": ["preparation"],
        "min_tasks": 3,
        "forbidden_assumptions": [],
    },

    # ── Event ─────────────────────────────────────────────────────────── #
    {
        "id": "event_001",
        "category": "event",
        "raw_intent": "Attending a music concert in Mumbai on Saturday evening. Coming from Pune by road.",
        "activity_type": "event",
        "origin": "Pune",
        "destination": "Mumbai",
        "expected_features": {
            "has_time_constraint": True,
            "needs_route": True,
        },
        "expected_plan_sections": ["preparation", "journey"],
        "min_tasks": 3,
        "forbidden_assumptions": [],
    },

    # ── Conference ────────────────────────────────────────────────────── #
    {
        "id": "conference_001",
        "category": "conference",
        "raw_intent": "I'm presenting a paper at a tech conference in Bengaluru next Monday-Wednesday. I'm flying from Delhi.",
        "activity_type": "conference",
        "origin": "Delhi",
        "destination": "Bengaluru",
        "expected_features": {
            "has_time_constraint": True,
            "needs_packing_list": True,
            "needs_itinerary": True,
        },
        "expected_plan_sections": ["preparation"],
        "min_tasks": 6,
        "forbidden_assumptions": [],
    },

    # ── Relocation ────────────────────────────────────────────────────── #
    {
        "id": "relocation_001",
        "category": "relocation",
        "raw_intent": "I'm relocating from Mumbai to Bengaluru for a new job next month. Need to move my furniture and set up accommodation.",
        "activity_type": "relocation",
        "origin": "Mumbai",
        "destination": "Bengaluru",
        "expected_features": {
            "needs_packing_list": True,
            "needs_places": True,
        },
        "expected_plan_sections": ["preparation"],
        "min_tasks": 8,
        "forbidden_assumptions": [],
    },

    # ── Custom / Generic ──────────────────────────────────────────────── #
    {
        "id": "custom_001",
        "category": "custom",
        "raw_intent": "Help me plan everything I need to do before starting my new business next month.",
        "activity_type": "custom",
        "expected_features": {},
        "expected_plan_sections": ["preparation"],
        "min_tasks": 4,
        "forbidden_assumptions": [],
    },
    {
        "id": "custom_002",
        "category": "custom",
        "raw_intent": "I want to run a 5km charity run next Sunday morning. I've never run before.",
        "activity_type": "event",
        "expected_features": {
            "has_time_constraint": True,
        },
        "expected_plan_sections": ["preparation"],
        "min_tasks": 3,
        "forbidden_assumptions": [],
    },
]
