"""
Model registry — import all models here so Alembic sees Base.metadata.

Order matters: independent tables first, then dependent tables.
Circular FK between Plan.created_from_run_id and PlanRun.plan_id is
handled in the Alembic migration via a two-step ALTER TABLE.
"""

from lifeos.db.models.user import User  # noqa: F401
from lifeos.db.models.activity import Activity  # noqa: F401
from lifeos.db.models.plan_run import PlanRun  # noqa: F401
from lifeos.db.models.plan import Plan  # noqa: F401
from lifeos.db.models.plan_section import PlanSection  # noqa: F401
from lifeos.db.models.task import Task, TaskDependency  # noqa: F401
from lifeos.db.models.place import Place  # noqa: F401
from lifeos.db.models.plan_place import PlanPlace  # noqa: F401
from lifeos.db.models.route import Route  # noqa: F401
from lifeos.db.models.route_stop import RouteStop  # noqa: F401
from lifeos.db.models.packing_item import PackingItem  # noqa: F401
from lifeos.db.models.itinerary_item import ItineraryItem  # noqa: F401
from lifeos.db.models.tool_call import ToolCall  # noqa: F401
from lifeos.db.models.evidence import Evidence  # noqa: F401

__all__ = [
    "User",
    "Activity",
    "PlanRun",
    "Plan",
    "PlanSection",
    "Task",
    "TaskDependency",
    "Place",
    "PlanPlace",
    "Route",
    "RouteStop",
    "PackingItem",
    "ItineraryItem",
    "ToolCall",
    "Evidence",
]
