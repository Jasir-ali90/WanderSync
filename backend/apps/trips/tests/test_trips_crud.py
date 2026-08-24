"""Trips creation + listing integration tests."""
from django.test import SimpleTestCase

from apps.trips.documents import Trip

from .base import TRIP_A, TRIP_B, TRIPS_URL, TripsTestBase


class TripCreateTests(TripsTestBase, SimpleTestCase):
    def test_create_requires_authentication(self):
        response = self.client.post(TRIPS_URL, TRIP_A, content_type="application/json")
        self.assertEqual(response.status_code, 401)

    def test_create_success_sets_owner_and_duration(self):
        response = self.as_user_a().post(
            TRIPS_URL, TRIP_A, content_type="application/json"
        )
        body = response.json()
        self.assertEqual(response.status_code, 201)
        trip = body["data"]["trip"]
        # Apr 10 -> Apr 16 inclusive = 7 days.
        self.assertEqual(trip["duration_days"], 7)
        persisted = Trip.objects(id=trip["id"]).first()
        self.assertEqual(len(persisted.owner_public_id), 32)
        self.assertEqual(persisted.budget_currency, "EUR")

    def test_create_rejects_end_before_start(self):
        payload = {**TRIP_A, "start_date": "2027-04-16", "end_date": "2027-04-10"}
        response = self.as_user_a().post(
            TRIPS_URL, payload, content_type="application/json"
        )
        body = response.json()
        self.assertEqual(response.status_code, 400)
        self.assertFalse(body["success"])
        self.assertIn("end_date", str(body["error"]["details"]))

    def test_create_rejects_missing_destination(self):
        payload = {k: v for k, v in TRIP_A.items() if k != "destination"}
        response = self.as_user_a().post(
            TRIPS_URL, payload, content_type="application/json"
        )
        self.assertEqual(response.status_code, 400)

    def test_create_rejects_invalid_status_and_budget_level(self):
        bad_status = self.as_user_a().post(
            TRIPS_URL, {**TRIP_B, "status": "teleported"}, content_type="application/json"
        )
        bad_level = self.as_user_a().post(
            TRIPS_URL,
            {**TRIP_B, "budget_level": "infinite"},
            content_type="application/json",
        )
        self.assertEqual(bad_status.status_code, 400)
        self.assertEqual(bad_level.status_code, 400)

    def test_create_defaults_are_sane(self):
        response = self.as_user_a().post(
            TRIPS_URL, TRIP_B, content_type="application/json"
        )
        trip = response.json()["data"]["trip"]
        self.assertEqual(trip["status"], "draft")
        self.assertEqual(trip["visibility"], "private")
        self.assertEqual(trip["budget"]["level"], "moderate")


class TripListTests(TripsTestBase, SimpleTestCase):
    def test_list_requires_authentication(self):
        response = self.client.get(TRIPS_URL)
        self.assertEqual(response.status_code, 401)

    def test_list_returns_only_own_trips(self):
        self.create_trip(token=self.token_a)
        self.create_trip(payload=TRIP_B, token=self.token_b)

        seen_a = self.as_user_a().get(TRIPS_URL).json()["data"]
        seen_b = self.as_user_b().get(TRIPS_URL).json()["data"]

        self.assertEqual(seen_a["count"], 1)
        self.assertEqual(seen_a["results"][0]["title"], TRIP_A["title"])
        self.assertEqual(seen_b["count"], 1)
        self.assertEqual(seen_b["results"][0]["title"], TRIP_B["title"])

    def test_list_supports_pagination_meta(self):
        for i in range(3):
            self.create_trip(payload={**TRIP_B, "title": f"Trip {i}"}, token=self.token_a)
        data = (
            self.as_user_a()
            .get(f"{TRIPS_URL}?page=1&page_size=2")
            .json()["data"]
        )
        self.assertEqual(data["count"], 3)
        self.assertEqual(data["pages"], 2)
        self.assertEqual(len(data["results"]), 2)

    def test_list_filters_by_status(self):
        trip = self.create_trip(token=self.token_a)
        self.as_user_a().patch(
            f"{TRIPS_URL}{trip['id']}/",
            {"status": "planned"},
            content_type="application/json",
        )
        planned = self.as_user_a().get(f"{TRIPS_URL}?status=planned").json()["data"]
        draft = self.as_user_a().get(f"{TRIPS_URL}?status=draft").json()["data"]
        self.assertEqual(planned["count"], 1)
        self.assertEqual(draft["count"], 0)

    def test_list_rejects_invalid_status_value(self):
        response = self.as_user_a().get(f"{TRIPS_URL}?status=bogus")
        self.assertEqual(response.status_code, 400)

    def test_list_destination_filter_matches_case_insensitive(self):
        self.create_trip(token=self.token_a)
        data = self.as_user_a().get(f"{TRIPS_URL}?destination=italy").json()["data"]
        self.assertEqual(data["count"], 1)
