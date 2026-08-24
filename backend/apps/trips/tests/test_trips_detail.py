"""Trip detail (ownership), validation, and stats integration tests."""
from django.test import SimpleTestCase

from apps.trips.documents import Trip

from .base import TRIP_A, TRIP_B, TRIPS_URL, TripsTestBase


class TripDetailTests(TripsTestBase, SimpleTestCase):
    def test_owner_can_read_update_delete(self):
        trip = self.create_trip(token=self.token_a)
        url = f"{TRIPS_URL}{trip['id']}/"

        read = self.as_user_a().get(url)
        self.assertEqual(read.status_code, 200)
        self.assertEqual(read.json()["data"]["trip"]["title"], TRIP_A["title"])

        patched = self.as_user_a().patch(
            url,
            {"title": "Cultural Italy Revised"},
            content_type="application/json",
        )
        self.assertEqual(patched.status_code, 200)
        self.assertEqual(
            patched.json()["data"]["trip"]["title"], "Cultural Italy Revised"
        )

        deleted = self.as_user_a().delete(url)
        self.assertEqual(deleted.status_code, 200)
        self.assertIsNone(Trip.objects(id=trip["id"]).first())
        self.assertEqual(self.as_user_a().get(url).status_code, 404)

    def test_other_user_gets_404_not_403(self):
        trip = self.create_trip(token=self.token_a)
        url = f"{TRIPS_URL}{trip['id']}/"
        get = self.as_user_b().get(url)
        patch = self.as_user_b().patch(
            url, {"title": "Hijacked"}, content_type="application/json"
        )
        delete = self.as_user_b().delete(url)
        self.assertEqual(get.status_code, 404)
        self.assertEqual(patch.status_code, 404)
        self.assertEqual(delete.status_code, 404)

    def test_malformed_trip_id_returns_404(self):
        response = self.as_user_a().get(f"{TRIPS_URL}not-an-objectid/")
        self.assertEqual(response.status_code, 404)

    def test_patch_validates_payload(self):
        trip = self.create_trip(token=self.token_a)
        response = self.as_user_a().patch(
            f"{TRIPS_URL}{trip['id']}/",
            {"travelers": 99},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)


class TripStatsTests(TripsTestBase, SimpleTestCase):
    def test_stats_aggregate_own_trips_only(self):
        self.create_trip(token=self.token_a)
        self.create_trip(payload=TRIP_B, token=self.token_b)
        data = self.as_user_a().get(f"{TRIPS_URL}stats/summary/").json()["data"]
        self.assertEqual(data["total_trips"], 1)
        self.assertEqual(data["by_status"]["draft"], 1)
        self.assertEqual(data["total_planned_days"], 7)
        self.assertEqual(data["destinations"], ["Italy"])
