"""Automatic geocoding of itinerary activities.

Fills missing latitude/longitude on trip activities using the live places
provider (Nominatim), so the map and weather panels work even for demo or
manually authored plans.
"""
import logging
import math

from apps.travel import services

logger = logging.getLogger(__name__)

# Keep each request bounded — Nominatim is a free, rate-limited service.
MAX_LOOKUPS_PER_REQUEST = 40


def _query_for(activity_location: str, destination: str) -> str:
    location = activity_location.strip()
    if not location:
        return ""
    # Landmarks are often relative ("Louvre"); anchor them to the destination.
    if destination.lower() and destination.lower() not in location.lower():
        return f"{location}, {destination}"
    return location


KNOWN_CITY_COORDS = {
    "paris": (48.8566, 2.3522),
    "london": (51.5074, -0.1278),
    "tokyo": (35.6762, 139.6503),
    "dubai": (25.2048, 55.2708),
    "new york": (40.7128, -74.0060),
    "hunza": (36.3167, 74.6500),
    "hunza valley": (36.3167, 74.6500),
    "rome": (41.9028, 12.4964),
    "bali": (-8.4095, 115.1889),
    "sydney": (-33.8688, 151.2093),
    "cairo": (30.0444, 31.2357),
    "istanbul": (41.0082, 28.9784),
    "singapore": (1.3521, 103.8198),
    "lahore": (31.5204, 74.3587),
    "islamabad": (33.6844, 73.0479),
    "skardu": (35.2971, 75.6333),
}


def fill_missing_coordinates(trip) -> dict:
    """Resolve coordinates for activities lacking them; mutate ``trip`` in place."""
    resolved = 0
    approximated = 0
    attempted = 0

    # Resolve the destination once for the approximation fallback.
    destination_point = None
    try:
        result = services.search_places(trip.destination or "", limit=1)
        candidate = ((result or {}).get("results") or [None])[0]
        if candidate and isinstance(candidate.get("lat"), (int, float)) and isinstance(candidate.get("lon"), (int, float)):
            destination_point = (float(candidate["lat"]), float(candidate["lon"]))
    except Exception:
        logger.exception("Destination geocode failed: %s", trip.destination)

    if not destination_point:
        dest_lower = (trip.destination or "").strip().lower()
        for city_key, coords in KNOWN_CITY_COORDS.items():
            if city_key in dest_lower:
                destination_point = coords
                break
        if not destination_point:
            destination_point = (48.8566, 2.3522)  # Default center fallback

    def missing_total() -> int:
        return sum(
            1
            for d in trip.itinerary.days
            for a in d.activities
            if a.latitude is None or a.longitude is None
        )

    for day_index, day in enumerate(trip.itinerary.days):
        for activity_index, activity in enumerate(day.activities):
            if activity.latitude is not None and activity.longitude is not None:
                continue

            matched = False
            if attempted < MAX_LOOKUPS_PER_REQUEST:
                query = _query_for(activity.location_name, trip.destination) or trip.destination
                attempted += 1
                try:
                    result = services.search_places(query, limit=1)
                except Exception:
                    result = None
                match = ((result or {}).get("results") or [None])[0]
                if match and isinstance(match.get("lat"), (int, float)) and isinstance(match.get("lon"), (int, float)):
                    activity.latitude = float(match["lat"])
                    activity.longitude = float(match["lon"])
                    resolved += 1
                    matched = True

            if not matched:
                order = day_index * 8 + activity_index
                angle = order * 2.399963
                radius_km = 0.8 + (order % 5) * 0.55
                base_lat, base_lon = destination_point
                activity.latitude = round(
                    base_lat + (radius_km / 111.32) * math.cos(angle), 5
                )
                activity.longitude = round(
                    base_lon
                    + (radius_km / (111.32 * max(math.cos(math.radians(base_lat)), 0.01)))
                    * math.sin(angle),
                    5,
                )
                approximated += 1

    if resolved > 0 or approximated > 0:
        trip.save()

    return {
        "resolved": resolved,
        "approximated": approximated,
        "attempted": attempted,
        "truncated": attempted >= MAX_LOOKUPS_PER_REQUEST,
        "total_missing": missing_total(),
    }
