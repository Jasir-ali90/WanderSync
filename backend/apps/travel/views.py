"""Travel data API endpoints (places, weather, hotels, events)."""
from drf_spectacular.utils import extend_schema
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView

from apps.common.responses import error_response, success_response
from apps.travel import services


class PlaceSearchView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["travel"])
    def get(self, request):
        query = (request.query_params.get("q") or "").strip()
        if len(query) < 2:
            return error_response(
                "Please provide at least two characters to search.",
                code="VALIDATION_ERROR",
            )
        try:
            limit = int(request.query_params.get("limit", 5))
        except ValueError:
            limit = 5
        result = services.search_places(query, limit=max(1, min(limit, 10)))
        if result is None:
            return success_response(
                {"source": "demo", "results": []},
                message="No matching places found.",
            )
        return success_response(result)


class PlaceDetailView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["travel"])
    def get(self, request, place_id: str):
        result = services.get_place_details(place_id)
        if result is None:
            return success_response(
                {"source": "demo", "place": {}}, message="No details available."
            )
        return success_response(result)


class WeatherView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["travel"])
    def get(self, request):
        try:
            lat = float(request.query_params.get("lat"))
            lon = float(request.query_params.get("lon"))
        except (TypeError, ValueError):
            return error_response(
                "Provide numeric 'lat' and 'lon' query parameters.",
                code="VALIDATION_ERROR",
            )
        if not (-90 <= lat <= 90 and -180 <= lon <= 180):
            return error_response("Coordinates out of range.", code="VALIDATION_ERROR")
        # Optional arrival date so the forecast matches *when* you'll be there.
        start_param = (request.query_params.get("start") or "").strip()
        arrival = None
        if start_param:
            from datetime import date as date_cls

            try:
                arrival = date_cls.fromisoformat(start_param)
            except ValueError:
                return error_response(
                    "'start' must be an ISO date like 2026-09-12.",
                    code="VALIDATION_ERROR",
                )
        try:
            days = int(request.query_params.get("days", 3))
        except ValueError:
            days = 3
        days = max(1, min(days, 7))
        result = services.get_weather(lat, lon, days, start=arrival)
        if result is None:
            return error_response(
                "Weather is temporarily unavailable. Please retry shortly.",
                code="SERVICE_UNAVAILABLE",
                status=503,
            )
        return success_response(result)


class HotelSearchView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["travel"])
    def get(self, request):
        city = (request.query_params.get("city") or "").strip()
        if len(city) < 2:
            return error_response(
                "Provide a city to search hotels.", code="VALIDATION_ERROR"
            )
        result = services.search_hotels(city)
        if result is None:
            return success_response({"source": "demo", "results": []})
        return success_response(result)


class SpotCatalogView(APIView):
    """Curated Famous Spots catalog (countries -> iconic places)."""

    # Public: the catalog is static, hand-curated marketing content — the
    # landing-page carousel shows it to visitors before login.
    permission_classes = [AllowAny]

    @extend_schema(tags=["travel"])
    def get(self, request):
        from apps.travel.spot_data import get_spot_catalog

        country = request.query_params.get("country")
        return success_response(get_spot_catalog(country))


class EventsView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["travel"])
    def get(self, request):
        city = (request.query_params.get("city") or "").strip()
        if len(city) < 2:
            return error_response(
                "Provide a city to search events.", code="VALIDATION_ERROR"
            )
        start = request.query_params.get("start") or None
        end = request.query_params.get("end") or None
        result = services.get_events(city, start=start, end=end)
        if result is None:
            return success_response({"source": "demo", "results": []})
        return success_response(result)
