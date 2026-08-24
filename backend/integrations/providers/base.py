"""Provider abstraction — swap providers without touching services.

Every method returns plain JSON-serialisable dicts, or None when the provider
cannot serve the request. Callers layer caching + DEMO fallbacks on top.
"""
from abc import ABC, abstractmethod


class TravelProvider(ABC):
    name: str = "base"

    @abstractmethod
    def search_places(self, query: str, limit: int = 5) -> list[dict] | None:
        """Places matching a free-text query (cities, towns, landmarks)."""

    @abstractmethod
    def get_place_details(self, place_id: str) -> dict | None:
        """Details for one place previously returned by search_places."""

    @abstractmethod
    def get_weather(self, lat: float, lon: float, days: int = 3) -> dict | None:
        """Current conditions + daily forecast for a coordinate."""

    @abstractmethod
    def search_hotels(self, city: str, limit: int = 5) -> list[dict] | None:
        """Accommodation options for a city."""

    @abstractmethod
    def get_events(self, city: str, start=None, end=None, limit: int = 5) -> list[dict] | None:
        """Events happening in a city between two dates."""
