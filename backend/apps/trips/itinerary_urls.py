"""Itinerary editing URL routes (owner-scoped, inside /api/v1/trips/)."""
from django.urls import path

from apps.trips.itinerary_api import (
    ActivityCreateView,
    ActivityDeleteView,
    DayReplaceView,
    RegenerateDayView,
)

urlpatterns = [
    path(
        "<str:trip_id>/days/<int:day_number>/",
        DayReplaceView.as_view(),
        name="trip-day-replace",
    ),
    path(
        "<str:trip_id>/days/<int:day_number>/activities/",
        ActivityCreateView.as_view(),
        name="trip-activity-create",
    ),
    path(
        "<str:trip_id>/days/<int:day_number>/activities/<int:index>/",
        ActivityDeleteView.as_view(),
        name="trip-activity-delete",
    ),
    path(
        "<str:trip_id>/days/<int:day_number>/regenerate/",
        RegenerateDayView.as_view(),
        name="trip-day-regenerate",
    ),
]