"""URL routes for trips (/api/v1/trips/)."""
from django.urls import path

from apps.trips.views import TripDetailView, TripListCreateView, TripStatsView

urlpatterns = [
    path("stats/summary/", TripStatsView.as_view(), name="trip-stats"),
    path("", TripListCreateView.as_view(), name="trip-list-create"),
    path("<str:trip_id>/", TripDetailView.as_view(), name="trip-detail"),
]

