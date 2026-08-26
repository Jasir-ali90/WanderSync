"""URL routes for the admin panel (/api/v1/admin/)."""
from django.urls import path

from apps.adminpanel.views import (
    AdminStatsView,
    AdminTripDetailView,
    AdminTripsView,
    AdminUserDetailView,
    AdminUsersView,
)

urlpatterns = [
    path("stats/", AdminStatsView.as_view(), name="admin-stats"),
    path("users/", AdminUsersView.as_view(), name="admin-users"),
    path("users/<str:user_id>/", AdminUserDetailView.as_view(), name="admin-user-detail"),
    path("trips/", AdminTripsView.as_view(), name="admin-trips"),
    path("trips/<str:trip_id>/", AdminTripDetailView.as_view(), name="admin-trip-detail"),
]
