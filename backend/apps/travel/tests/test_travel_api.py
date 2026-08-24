"""Places & weather endpoint tests (LIVE via mock, cache, DEMO fallback)."""
from unittest import mock

from django.test import Client, SimpleTestCase

from integrations.cache import cache_clear

from .base import NOMINATIM_SEARCH_RESPONSE, OPEN_METEO_RESPONSE, TravelTestBase


class PlacesSearchTests(TravelTestBase, SimpleTestCase):
    def setUp(self):
        cache_clear()
        super().setUp()

    def tearDown(self):
        cache_clear()

    def test_requires_authentication(self):
        anonymous = Client()
        response = anonymous.get("/api/v1/places/search/?q=Paris")
        self.assertEqual(response.status_code, 401)

    def test_query_too_short_rejected(self):
        response = self.client.get("/api/v1/places/search/?q=P")
        self.assertEqual(response.status_code, 400)

    def test_live_results_from_nominatim(self):
        def handler(url, params):
            if "nominatim" in url and "/search" in url:
                return NOMINATIM_SEARCH_RESPONSE
            return None

        with self.patched_fetch(handler):
            response = self.client.get("/api/v1/places/search/?q=paris")
        body = response.json()["data"]
        self.assertEqual(body["source"], "live")
        self.assertEqual(body["results"][0]["name"], "Paris")

    def test_second_identical_query_served_from_cache(self):
        def handler(url, params):
            return NOMINATIM_SEARCH_RESPONSE if "nominatim" in url else None

        with self.patched_fetch(handler):
            first = self.client.get("/api/v1/places/search/?q=paris")
            second = self.client.get("/api/v1/places/search/?q=paris")
        self.assertEqual(first.json()["data"]["source"], "live")
        self.assertEqual(second.json()["data"]["source"], "cache")

    def test_provider_failure_falls_back_to_demo(self):
        with self.patched_fetch(lambda url, params: None):
            response = self.client.get("/api/v1/places/search/?q=atlantis")
        body = response.json()["data"]
        self.assertEqual(body["source"], "demo")
        self.assertTrue(body["results"])


class WeatherTests(TravelTestBase, SimpleTestCase):
    def setUp(self):
        cache_clear()
        super().setUp()

    def tearDown(self):
        cache_clear()

    def test_requires_numeric_coordinates(self):
        response = self.client.get("/api/v1/weather/?lat=abc&lon=2.0")
        self.assertEqual(response.status_code, 400)
        missing = self.client.get("/api/v1/weather/?lon=2.0")
        self.assertEqual(missing.status_code, 400)

    def test_out_of_range_coordinates_rejected(self):
        response = self.client.get("/api/v1/weather/?lat=99&lon=700")
        self.assertEqual(response.status_code, 400)

    def test_live_weather_from_open_meteo(self):
        def handler(url, params):
            if "open-meteo" in url:
                return OPEN_METEO_RESPONSE
            return None

        with self.patched_fetch(handler):
            response = self.client.get("/api/v1/weather/?lat=48.85&lon=2.35&days=3")
        body = response.json()["data"]
        self.assertEqual(body["source"], "live")
        current = body["current"]
        self.assertEqual(current["condition"], "Partly cloudy")  # WMO code 2
        self.assertEqual(len(body["forecast"]), 3)
        rainy = [f for f in body["forecast"] if f["date"] == "2027-05-02"][0]
        self.assertEqual(rainy["condition"], "Slight rain")  # WMO code 61

    def test_weather_failure_falls_back_to_demo_estimate(self):
        with self.patched_fetch(lambda url, params: None):
            response = self.client.get("/api/v1/weather/?lat=0&lon=0")
        body = response.json()["data"]
        self.assertEqual(body["source"], "demo")
        self.assertTrue(body["forecast"])

    def test_weather_service_unavailable_returns_503_when_all_fails(self):
        with (
            self.patched_fetch(lambda url, params: None),
            mock.patch(
                "apps.travel.services._demo_provider.get_weather", return_value=None
            ),
        ):
            response = self.client.get("/api/v1/weather/?lat=0&lon=0")
        self.assertEqual(response.status_code, 503)


class HotelsEventsTests(TravelTestBase, SimpleTestCase):
    def test_hotels_are_labelled_demo_data(self):
        response = self.client.get("/api/v1/hotels/?city=Rome")
        body = response.json()["data"]
        self.assertEqual(body["source"], "demo")
        self.assertTrue(any("Demo" in h["note"] or "demo" in h["note"] for h in body["results"]))

    def test_events_are_labelled_demo_data(self):
        response = self.client.get("/api/v1/events/?city=Rome")
        body = response.json()["data"]
        self.assertEqual(body["source"], "demo")
        self.assertTrue(all("Demo" in e["note"] for e in body["results"]))

    def test_hotels_require_city(self):
        response = self.client.get("/api/v1/hotels/")
        self.assertEqual(response.status_code, 400)
