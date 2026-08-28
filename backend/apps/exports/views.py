"""Export API endpoints (PDF + ICS), owner-scoped and rate-limited."""
import logging

from bson import ObjectId
from drf_spectacular.utils import extend_schema
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from django.http import HttpResponse

from apps.exports.pdf import build_trip_ics, build_trip_pdf_bytes
from apps.trips.documents import Trip

logger = logging.getLogger(__name__)


class ExportThrottle(ScopedRateThrottle):
    throttle_scope = "export"


def _get_own_trip(request, trip_id: str) -> Trip:
    if not ObjectId.is_valid(str(trip_id)):
        raise NotFound("Trip not found.")
    trip = Trip.objects(id=str(trip_id), owner_public_id=request.user.public_id).first()
    if trip is None:
        raise NotFound("Trip not found.")
    return trip


class TripPDFView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [ExportThrottle]

    @extend_schema(tags=["exports"])
    def get(self, request, trip_id: str):
        trip = _get_own_trip(request, trip_id)
        data = build_trip_pdf_bytes(trip)
        filename = f"wandersync-{trip.id}.pdf"
        from apps.notifications.service import notify_export_completed

        notify_export_completed(request.user.public_id, str(trip.id), "pdf")
        response = HttpResponse(data, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response


class TripICSView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [ExportThrottle]

    @extend_schema(tags=["exports"])
    def get(self, request, trip_id: str):
        trip = _get_own_trip(request, trip_id)
        data = build_trip_ics(trip)
        filename = f"wandersync-{trip.id}.ics"
        response = HttpResponse(data, content_type="text/calendar; charset=utf-8")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response