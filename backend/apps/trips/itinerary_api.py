"""Itinerary editing endpoints for the trip studio.

All routes are owner-scoped via the shared trip lookup; every mutation
re-repairs the schedule and re-scores the trip.
"""
import logging

from drf_spectacular.utils import extend_schema
from rest_framework import serializers, status
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.common.responses import error_response, success_response
from apps.trips.documents import Activity
from apps.trips.itinerary_services import (
    ItineraryError,
    append_activity,
    regenerate_day,
    remove_activity,
    replace_day_activities,
)
from apps.trips.views import TripDetailView

logger = logging.getLogger(__name__)

CATEGORIES = [
    "attraction", "museum", "food", "nature", "shopping",
    "transport", "hotel", "nightlife", "beach", "tour", "rest",
]
MOODS = ["relaxed", "balanced", "packed", "budget", "premium", "family"]


class ActivityWriteSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=200)
    description = serializers.CharField(max_length=800, required=False, default="", allow_blank=True)
    start_time = serializers.RegexField(
        r"^([01]\d|2[0-3]):[0-5]\d$", required=False, allow_blank=True, default=""
    )
    duration_minutes = serializers.IntegerField(min_value=15, max_value=600, default=60)
    location_name = serializers.CharField(max_length=250, required=False, default="", allow_blank=True)
    latitude = serializers.FloatField(required=False, allow_null=True, min_value=-90, max_value=90)
    longitude = serializers.FloatField(required=False, allow_null=True, min_value=-180, max_value=180)
    category = serializers.ChoiceField(choices=CATEGORIES, default="attraction")
    cost_estimate = serializers.DecimalField(
        max_digits=9, decimal_places=2, min_value=0, default=0
    )
    notes = serializers.CharField(max_length=1000, required=False, default="", allow_blank=True)


class DayReplaceSerializer(serializers.Serializer):
    activities = ActivityWriteSerializer(many=True)


class RegenerateSerializer(serializers.Serializer):
    mood = serializers.ChoiceField(choices=MOODS)


def _activity_from_validated(data: dict) -> Activity:
    return Activity(
        name=data["name"].strip(),
        description=data.get("description", ""),
        start_time=data.get("start_time") or "",
        duration_minutes=int(data.get("duration_minutes", 60)),
        location_name=(data.get("location_name") or "").strip(),
        latitude=data.get("latitude"),
        longitude=data.get("longitude"),
        category=data.get("category", "attraction"),
        cost_estimate=float(data.get("cost_estimate") or 0),
        notes=data.get("notes", ""),
    )


class ItineraryBaseView(TripDetailView):
    """Inherits the owner-scoped ``_get_trip`` lookup."""

    permission_classes = [IsAuthenticated]

    def _handle(self, callable_, *args):
        try:
            trip = callable_(*args)
        except ItineraryError as exc:
            if exc.code in ("DAY_NOT_FOUND", "ACTIVITY_NOT_FOUND"):
                raise NotFound(exc.message)
            raise ValidationError(exc.message)
        return success_response(
            {"trip": trip.to_api_dict()}, message="Itinerary updated."
        )


class DayReplaceView(ItineraryBaseView):
    @extend_schema(request=DayReplaceSerializer, tags=["itinerary"])
    def put(self, request, trip_id: str, day_number: int):
        trip = self._get_trip(request, trip_id)
        serializer = DayReplaceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        activities = [
            _activity_from_validated(item) for item in serializer.validated_data["activities"]
        ]
        return self._handle(replace_day_activities, trip, day_number, activities)


class ActivityCreateView(ItineraryBaseView):
    @extend_schema(request=ActivityWriteSerializer, tags=["itinerary"])
    def post(self, request, trip_id: str, day_number: int):
        trip = self._get_trip(request, trip_id)
        serializer = ActivityWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        activity = _activity_from_validated(serializer.validated_data)
        return self._handle(append_activity, trip, day_number, activity)


class ActivityDeleteView(ItineraryBaseView):
    @extend_schema(tags=["itinerary"])
    def delete(self, request, trip_id: str, day_number: int, index: int):
        trip = self._get_trip(request, trip_id)
        return self._handle(remove_activity, trip, day_number, index)


class RegenerateDayView(ItineraryBaseView):
    @extend_schema(request=RegenerateSerializer, tags=["itinerary"])
    def post(self, request, trip_id: str, day_number: int):
        trip = self._get_trip(request, trip_id)
        serializer = RegenerateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            updated, used_ai = regenerate_day(
                trip, day_number, serializer.validated_data["mood"]
            )
        except Exception:
            logger.exception("Regeneration failed for trip %s", trip_id)
            return error_response(
                "Couldn't regenerate that day right now — please try again.",
                code="REGENERATION_FAILED",
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return success_response(
            {"trip": updated.to_api_dict(), "engine": "openai" if used_ai else "demo"},
            message=f"Day {day_number} regenerated.",
        )

