"""Nominatim (OpenStreetMap) places provider — keyless LIVE data.

Respects the usage policy: a descriptive User-Agent and low volume
(responses are cached by the service layer).
"""
from integrations.http import fetch_json
from integrations.providers.base import TravelProvider

BASE_URL = "https://nominatim.openstreetmap.org"
USER_AGENT = {"User-Agent": "WanderSync/1.0 (educational project)"}


class NominatimPlacesProvider(TravelProvider):
    name = "nominatim"

    def search_places(self, query: str, limit: int = 5) -> list[dict] | None:
        data = fetch_json(
            f"{BASE_URL}/search",
            params={
                "q": query,
                "format": "jsonv2",
                "limit": max(1, min(limit, 10)),
                "addressdetails": 1,
            },
            headers=USER_AGENT,
        )
        if not isinstance(data, list) or not data:
            return None if not isinstance(data, list) else []
        results = []
        for item in data:
            try:
                results.append(
                    {
                        "id": f"{item.get('osm_type', 'node')}/{item.get('osm_id')}",
                        "place_id": str(item.get("place_id", "")),
                        "name": item.get("name") or item.get("display_name", "").split(",")[0],
                        "type": item.get("type", ""),
                        "category": item.get("class", ""),
                        "address": item.get("display_name", ""),
                        "lat": float(item["lat"]),
                        "lon": float(item["lon"]),
                        "importance": float(item.get("importance", 0)),
                    }
                )
            except (KeyError, TypeError, ValueError):
                continue
        # Most relevant first.
        results.sort(key=lambda r: r["importance"], reverse=True)
        return results

    def get_place_details(self, place_id: str) -> dict | None:
        if not str(place_id).isdigit():
            return None
        data = fetch_json(
            f"{BASE_URL}/details.php",
            params={"place_id": place_id, "format": "json"},
            headers=USER_AGENT,
        )
        if not isinstance(data, dict) or not data:
            return None
        centroid = data.get("centroid", {}).get("coordinates", [None, None])
        names = data.get("names", {}) or {}
        return {
            "id": f"{data.get('osm_type', 'node')}/{data.get('osm_id')}",
            "place_id": str(data.get("place_id", place_id)),
            "name": names.get("name", ""),
            "type": data.get("type", ""),
            "category": data.get("category", ""),
            "address": str(names.get("display_name") or names.get("name") or ""),
            "lat": centroid[1],
            "lon": centroid[0],
            "description": (
                f"Category: {data.get('category', 'n/a')} · "
                f"Type: {data.get('type', 'n/a')}"
            ),
        }


    def get_weather(self, lat: float, lon: float, days: int = 3) -> dict | None:
        return None  # weather handled by Open-Meteo adapter

    def search_hotels(self, city: str, limit: int = 5) -> list[dict] | None:
        return None  # no keyless hotel source; DEMO fallback serves this

    def get_events(self, city: str, start=None, end=None, limit: int = 5):
        return None  # same as hotels
