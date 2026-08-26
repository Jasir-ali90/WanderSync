"""WanderSync URL configuration.

All API routes live under /api/v1/. Each app contributes its own urls module.
"""
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from apps.common.views import health_check

api_v1 = [
    path("auth/", include("apps.accounts.urls")),
    # Trips include the itinerary studio routes.
    path("trips/", include("apps.trips.urls")),
    path("trips/", include("apps.trips.itinerary_urls")),
    path("planner/", include("apps.planner.urls")),
    # Admin panel (staff only)
    path("admin/", include("apps.adminpanel.urls")),
    # --- Travel data (places/weather/hotels/events share one route table).
    path("", include("apps.travel.urls")),
    # Sharing
    path("share/", include("apps.sharing.urls")),
    # Exports (PDF/ICS)
    path("export/", include("apps.exports.urls")),
    # Health / readiness probe.
    path("health/", health_check, name="health"),
    # OpenAPI schema + Swagger UI (drf-spectacular).
    path("schema/", SpectacularAPIView.as_view(), name="schema"),
    path("schema/swagger-ui/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
]






urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include(api_v1)),
]
