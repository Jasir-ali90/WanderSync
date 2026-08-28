"""URL routes for trips (/api/v1/trips/)."""
from django.urls import path

from apps.trips.views import (
    TripBudgetView,
    TripCollaboratorsView,
    TripDetailView,
    TripExpensesView,
    TripGeocodeView,
    TripListCreateView,
    TripPollsView,
    TripPollVoteView,
    TripStatsView,
)

urlpatterns = [
    path("stats/summary/", TripStatsView.as_view(), name="trip-stats"),
    path("<str:trip_id>/budget/", TripBudgetView.as_view(), name="trip-budget"),
    path("<str:trip_id>/geocode/", TripGeocodeView.as_view(), name="trip-geocode"),
    path("<str:trip_id>/collaborators/", TripCollaboratorsView.as_view(), name="trip-collaborators"),
    path("<str:trip_id>/polls/", TripPollsView.as_view(), name="trip-polls"),
    path("<str:trip_id>/polls/<str:poll_id>/vote/", TripPollVoteView.as_view(), name="trip-poll-vote"),
    path("<str:trip_id>/expenses/", TripExpensesView.as_view(), name="trip-expenses"),
    path("", TripListCreateView.as_view(), name="trip-list-create"),
    path("<str:trip_id>/", TripDetailView.as_view(), name="trip-detail"),
]

