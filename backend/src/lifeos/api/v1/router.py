"""API v1 root router — includes all domain routers."""

from fastapi import APIRouter

from lifeos.api.v1 import activities, notifications, places, plans, routes, tasks

router = APIRouter()

router.include_router(activities.router, prefix="/activities", tags=["Activities"])
router.include_router(plans.router, prefix="/plans", tags=["Plans"])
router.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])
router.include_router(places.router, prefix="/places", tags=["Places"])
router.include_router(routes.router, prefix="/routes", tags=["Routes"])
router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
