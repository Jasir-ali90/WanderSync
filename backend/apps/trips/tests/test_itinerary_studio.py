"""Itinerary editing + day regeneration integration tests."""
from django.test import Client, SimpleTestCase

from apps.accounts.documents import User
from apps.trips.documents import Trip

PASSWORD = "Sup3r-Secret-Pass!"
TRIPS_URL = "/api/v1/trips/"

NEW_ACTIVITY = {
    "name": "Colosseum at sunset",
    "description": "Guided visit with gladiator stories.",
    "start_time": "17:00",
    "duration_minutes": 90,
    "location_name": "Rome",
    "category": "museum",
    "cost_estimate": "28.00",
}


class StudioTestBase:
    def setUp(self):
        self.client = Client()
        User.drop_collection()
        Trip.drop_collection()
        response = self.client.post(
            "/api/v1/auth/register/",
            {"email": "amelia@example.com", "password": PASSWORD},
            content_type="application/json",
        )
        assert response.status_code == 201, response.content
        self.token = response.json()["data"]["tokens"]["access"]
        self.client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {self.token}"
        self.trip_id = self._make_trip()

    def tearDown(self):
        User.drop_collection()
        Trip.drop_collection()

    def _make_trip(self) -> str:
        response = self.client.post(
            TRIPS_URL,
            {
                "title": "Rome Weekend",
                "destination": "Rome",
                "start_date": "2027-05-10",
                "end_date": "2027-05-12",
                "travelers": 2,
                "budget_amount": "800",
            },
            content_type="application/json",
        )
        assert response.status_code == 201, response.content
        return response.json()["data"]["trip"]["id"]


class DayReplaceTests(StudioTestBase, SimpleTestCase):
    def test_replace_day_updates_and_rescores(self):
        url = f"{TRIPS_URL}{self.trip_id}/days/1/"
        response = self.client.put(
            url, {"activities": [NEW_ACTIVITY]}, content_type="application/json"
        )
        body = response.json()["data"]["trip"]
        self.assertEqual(len(body["itinerary"]["days"][0]["activities"]), 1)
        self.assertEqual(
            body["itinerary"]["days"][0]["activities"][0]["name"], "Colosseum at sunset"
        )

    def test_replace_foreign_trip_404(self):
        other = Client()
        reg = other.post(
            "/api/v1/auth/register/",
            {"email": "ben@example.com", "password": PASSWORD},
            content_type="application/json",
        )
        token = reg.json()["data"]["tokens"]["access"]
        other.defaults["HTTP_AUTHORIZATION"] = f"Bearer {token}"
        response = other.put(
            f"{TRIPS_URL}{self.trip_id}/days/1/",
            {"activities": [NEW_ACTIVITY]},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 404)

    def test_invalid_activity_rejected(self):
        url = f"{TRIPS_URL}{self.trip_id}/days/1/"
        bad = {**NEW_ACTIVITY, "duration_minutes": 5}
        response = self.client.put(
            url, {"activities": [bad]}, content_type="application/json"
        )
        self.assertEqual(response.status_code, 400)

    def test_missing_day_404(self):
        response = self.client.put(
            f"{TRIPS_URL}{self.trip_id}/days/99/",
            {"activities": [NEW_ACTIVITY]},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 404)


class RegenerateDayTests(StudioTestBase, SimpleTestCase):
    def test_regenerate_relaxed_day(self):
        response = self.client.post(
            f"{TRIPS_URL}{self.trip_id}/days/1/regenerate/",
            {"mood": "relaxed"},
            content_type="application/json",
        )
        body = response.json()
        self.assertEqual(response.status_code, 200)
        trip = body["data"]["trip"]
        activities = trip["itinerary"]["days"][0]["activities"]
        self.assertTrue(activities)
        self.assertLessEqual(len(activities), 5)  # relaxed ~3-4
        self.assertIn("engine", body["data"])

    def test_regenerate_packed_gives_more_activities(self):
        response = self.client.post(
            f"{TRIPS_URL}{self.trip_id}/days/1/regenerate/",
            {"mood": "packed"},
            content_type="application/json",
        )
        packed = response.json()["data"]["trip"]["itinerary"]["days"][0]["activities"]
        relaxed = self.client.post(
            f"{TRIPS_URL}{self.trip_id}/days/1/regenerate/",
            {"mood": "relaxed"},
            content_type="application/json",
        ).json()["data"]["trip"]["itinerary"]["days"][0]["activities"]
        self.assertGreater(len(packed), len(relaxed))

    def test_regenerate_invalid_mood_400(self):
        response = self.client.post(
            f"{TRIPS_URL}{self.trip_id}/days/1/regenerate/",
            {"mood": "extreme"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)


class ActivityCrudTests(StudioTestBase, SimpleTestCase):
    def test_append_activity(self):
        url = f"{TRIPS_URL}{self.trip_id}/days/1/activities/"
        response = self.client.post(url, NEW_ACTIVITY, content_type="application/json")
        trip = response.json()["data"]["trip"]
        names = [a["name"] for a in trip["itinerary"]["days"][0]["activities"]]
        self.assertIn("Colosseum at sunset", names)

    def test_remove_activity(self):
        # Seed an activity first.
        self.client.post(
            f"{TRIPS_URL}{self.trip_id}/days/1/activities/",
            NEW_ACTIVITY,
            content_type="application/json",
        )
        trip = self.client.get(f"{TRIPS_URL}{self.trip_id}/").json()["data"]["trip"]
        count = len(trip["itinerary"]["days"][0]["activities"])
        self.assertGreater(count, 0)
        url = f"{TRIPS_URL}{self.trip_id}/days/1/activities/0/"
        response = self.client.delete(url)
        updated = response.json()["data"]["trip"]
        self.assertEqual(len(updated["itinerary"]["days"][0]["activities"]), count - 1)