"""Shared fixtures for travel API tests (HTTP fully mocked)."""
from contextlib import contextmanager, ExitStack
from unittest import mock

from django.test import Client

from apps.accounts.documents import User

PASSWORD = "Sup3r-Secret-Pass!"



class TravelTestBase:
    def setUp(self):
        User.drop_collection()
        self.client = Client()
        response = self.client.post(
            "/api/v1/auth/register/",
            {"email": "amelia@example.com", "password": PASSWORD},
            content_type="application/json",
        )
        assert response.status_code == 201, response.content
        self.token = response.json()["data"]["tokens"]["access"]
        self.client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {self.token}"

    @staticmethod
    def tearDown():
        User.drop_collection()

    @staticmethod
    @contextmanager
    def patched_fetch(handler):
        """Patch every ``fetch_json`` usage site (providers import by value)."""

        def fake(url, params=None, headers=None, timeout=12):
            return handler(url, params)

        targets = [
            "integrations.http.fetch_json",
            "integrations.providers.nominatim_places.fetch_json",
            "integrations.providers.open_meteo_weather.fetch_json",
        ]
        with ExitStack() as stack:
            for target in targets:
                stack.enter_context(mock.patch(target, side_effect=fake))
            yield



NOMINATIM_SEARCH_RESPONSE = [
    {
        "place_id": 123,
        "osm_type": "relation",
        "osm_id": 7444,
        "lat": "48.8566",
        "lon": "2.3522",
        "name": "Paris",
        "display_name": "Paris, Île-de-France, France",
        "class": "place",
        "type": "city",
        "importance": 0.98,
    }
]

OPEN_METEO_RESPONSE = {
    "latitude": 48.85,
    "longitude": 2.35,
    "current_weather": {
        "temperature": 21.4,
        "windspeed": 11.2,
        "weathercode": 2,
        "is_day": 1,
    },
    "daily": {
        "time": ["2027-05-01", "2027-05-02", "2027-05-03"],
        "temperature_2m_max": [24.0, 22.5, 25.1],
        "temperature_2m_min": [13.0, 12.0, 14.0],
        "precipitation_sum": [0.0, 3.2, 0.0],
        "windspeed_10m_max": [14.0, 18.0, 11.0],
        "weathercode": [2, 61, 0],
    },
}


