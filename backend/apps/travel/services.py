"""Travel data services: LIVE provider -> TTL cache -> DEMO fallback.

Every result is wrapped as ``{"source": "live"|"cache"|"demo", ...payload}``
so clients always know how fresh/trustworthy the data is.
"""
import logging

from django.conf import settings
from integrations.cache import cached
from integrations.providers.demo import DemoTravelProvider
from integrations.providers.nominatim_places import NominatimPlacesProvider
from integrations.providers.open_meteo_weather import OpenMeteoWeatherProvider

logger = logging.getLogger(__name__)

_places_provider = NominatimPlacesProvider()
_weather_provider = OpenMeteoWeatherProvider()
_demo_provider = DemoTravelProvider()

TTL = getattr(settings, "CACHE_TTL_SECONDS", 900)


def search_places(query: str, limit: int = 5) -> dict | None:

    key = f"places:search:{query.lower()}:{limit}"

    def producer():
        try:
            live = _places_provider.search_places(query, limit)
        except Exception:
            logger.exception("Places provider crashed")
            live = None
        if live:
            return {"results": live}
        demo = _demo_provider.search_places(query, limit)
        return {"results": demo, "_demo": True} if demo else None

    value, was_cached = cached(key, TTL, producer)
    if value is None:
        return None
    source = "demo" if value.pop("_demo", False) else ("cache" if was_cached else "live")
    return {"source": source, **value}


def get_place_details(place_id: str) -> dict | None:
    key = f"places:details:{place_id}"

    def producer():
        try:
            live = _places_provider.get_place_details(place_id)
        except Exception:
            logger.exception("Place details provider crashed")
            live = None
        return live or _demo_provider.get_place_details(place_id)

    value, was_cached = cached(key, TTL, producer)
    if value is None:
        return None
    return {
        "source": "cache" if was_cached else "live",
        "place": value,
    }


def get_weather(lat: float, lon: float, days: int = 3) -> dict | None:
    key = f"weather:{round(lat, 2)}:{round(lon, 2)}:{days}"

    def producer():
        try:
            live = _weather_provider.get_weather(lat, lon, days)
        except Exception:
            logger.exception("Weather provider crashed")
            live = None
        if live:
            return live
        demo = _demo_provider.get_weather(lat, lon, days)
        return dict(demo or {}, _demo=True) if demo else None

    value, was_cached = cached(key, TTL, producer)
    if value is None:
        return None
    source = "demo" if value.pop("_demo", False) else ("cache" if was_cached else "live")
    return {"source": source, **value}


def search_hotels(city: str, limit: int = 5) -> dict | None:
    key = f"hotels:{city.lower()}:{limit}"
    value, was_cached = cached(
        key, TTL, lambda: {"results": _demo_provider.search_hotels(city, limit)}
    )
    if value is None:
        return None
    return {"source": "demo", **value}


def get_events(city: str, start=None, end=None, limit: int = 5) -> dict | None:
    key = f"events:{city.lower()}:{start}:{end}:{limit}"
    value, was_cached = cached(
        key,
        TTL,
        lambda: {"results": _demo_provider.get_events(city, start, end, limit)},
    )
    if value is None:
        return None
    return {"source": "demo", **value}
