"""WanderSync URL configuration.

All API routes live under /api/v1/. Each app contributes its own urls module.
"""
from django.contrib import admin
from django.urls import include, path

from apps.common.views import health_check

api_v1 = [
    path("auth/", include("apps.accounts.urls")),
    path("trips/", include("apps.trips.urls")),
    # Health / readiness probe.
    path("health/", health_check, name="health"),
]



urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include(api_v1)),
]
