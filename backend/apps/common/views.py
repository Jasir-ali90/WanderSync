"""Health and readiness endpoints (public, unauthenticated)."""
from drf_spectacular.utils import extend_schema
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.throttling import AnonRateThrottle

from apps.common.responses import success_response
from config.db import ensure_connection


class HealthThrottle(AnonRateThrottle):
    rate = "120/min"


@extend_schema(
    operation_id="health_check",
    responses={200: {"description": "Service health snapshot"}},
    auth=[],
)
@api_view(["GET"])
@permission_classes([AllowAny])
@throttle_classes([HealthThrottle])
def health_check(request):
    """Report application status and database readiness.

    The endpoint never fails hard when MongoDB is unreachable; it reports
    degraded state so orchestrators can distinguish app vs. datastore issues.
    """
    database_ready = ensure_connection()
    return success_response(
        {
            "status": "ok" if database_ready else "degraded",
            "service": "wandersync-api",
            "version": "1.0.0",
            "database": {"engine": "mongodb", "ready": database_ready},
        },
        message="WanderSync API is healthy" if database_ready else "WanderSync API is up, but the database is unreachable",
    )
