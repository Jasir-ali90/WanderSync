"""DEMO providers — deterministic sample data, always clearly labelled.

Used when a LIVE provider fails or has no keyless source (hotels, events).
Nothing here pretends to be real-time data.
"""
from datetime import date, timedelta

from integrations.providers.base import TravelProvider


def _sample_places(query: str, limit: int) -> list[dict]:
    base = query.strip().title() or "Paris"
    return [
        {
            "id": f"demo/{base.lower().replace(' ', '-')}-{index}",
            "place_id": f"demo-{index}",
            "name": f"{base} City Center",
            "type": "city",
            "category": "place",
            "address": f"{base} — historic centre",
            "lat": 48.8566 + index * 0.01,
            "lon": 2.3522 + index * 0.01,
            "importance": 0.5,
        }
        for index in range(1, max(1, min(limit, 5)) + 1)
    ]


class DemoTravelProvider(TravelProvider):
    name = "demo"

    def search_places(self, query: str, limit: int = 5):
        return _sample_places(query, limit)

    def get_place_details(self, place_id: str):
        return {
            "id": str(place_id),
            "place_id": str(place_id),
            "name": "Demo Landmark",
            "type": "attraction",
            "category": "tourism",
            "address": "Demo address — sample data",
            "lat": 48.8566,
            "lon": 2.3522,
            "description": "Sample details (demo data).",
        }

    def get_weather(self, lat: float, lon: float, days: int = 3, start=None):
        days = max(1, min(days, 7))
        begin = start if hasattr(start, "year") else date.today()
        # Demo forecasts stay believable: within a week of today (or arrival).
        offset = max((begin - date.today()).days, 0) if begin else 0
        start = date.today() + timedelta(days=offset)
        forecast = []
        temps = [22.0, 24.5, 21.0, 19.5, 23.0, 20.0, 25.0]
        conditions = [("Partly cloudy", "⛅"), ("Slight rain", "🌧️"), ("Clear sky", "☀️")]
        for day_offset in range(days):
            condition, icon = conditions[day_offset % len(conditions)]
            forecast.append(
                {
                    "date": (start + timedelta(days=day_offset)).isoformat(),
                    "temp_max_c": temps[day_offset % len(temps)] + 2,
                    "temp_min_c": temps[day_offset % len(temps)] - 6,
                    "precipitation_mm": [0.0, 4.0, 0.0][day_offset % 3],
                    "precipitation_chance_pct": [10, 70, 5][day_offset % 3],
                    "wind_kmh": 12 + day_offset * 3,
                    "uv_index_max": [4, 2, 7][day_offset % 3],
                    "sunrise": f"{(start + timedelta(days=day_offset)).isoformat()}T06:42",
                    "sunset": f"{(start + timedelta(days=day_offset)).isoformat()}T19:58",
                    "condition": condition,
                    "icon": icon,
                }
            )
        current_condition, current_icon = conditions[0]
        return {
            "location": {"lat": lat, "lon": lon},
            "current": {
                "temperature_c": temps[0],
                "feels_like_c": temps[0] + 1.4,
                "humidity_pct": 54,
                "wind_kmh": 12,
                "precipitation_mm": 0.0,
                "condition": current_condition,
                "icon": current_icon,
                "is_day": True,
            },
            "forecast": forecast,
        }

    def search_hotels(self, city: str, limit: int = 5):
        base = city.strip().title() or "Paris"
        tiers = [("Comfort", 90), ("Boutique", 160), ("Grand", 260)]
        hotels = []
        for index in range(1, max(1, min(limit, 5)) + 1):
            tier_name, nightly = tiers[index % len(tiers)]
            hotels.append(
                {
                    "id": f"demo-hotel-{index}",
                    "name": f"{tier_name} Hotel {base}",
                    "area": f"{base} centre",
                    "nightly_rate_usd": nightly,
                    "rating": round(3.8 + (index % 3) * 0.35, 1),
                    "note": "Demo data — connect a hotel API for live availability.",
                }
            )
        return hotels

    def get_events(self, city: str, start=None, end=None, limit: int = 5):
        base = city.strip().title() or "Paris"
        start_date = start or date.today()
        events = []
        kinds = [
            ("Local Food Festival", "food"),
            ("Open-Air Concert", "music"),
            ("Art & Craft Market", "culture"),
            ("Marathon Weekend", "sports"),
        ]
        for index in range(max(1, min(limit, 4))):
            name, kind = kinds[index]
            events.append(
                {
                    "id": f"demo-event-{index + 1}",
                    "name": f"{name} — {base}",
                    "kind": kind,
                    "date": (start_date + timedelta(days=index + 1)).isoformat(),
                    "note": "Demo data — connect an events API for real listings.",
                }
            )
        return events
