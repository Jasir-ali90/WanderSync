"""Sharing + exports integration tests."""
import io

from django.test import Client, SimpleTestCase

from apps.accounts.documents import User
from apps.exports.pdf import build_trip_ics, build_trip_pdf_bytes
from apps.trips.documents import Trip

PASSWORD = "Sup3r-Secret-Pass!"


class ShareBase:
    register_url = "/api/v1/auth/register/"
    trips_url = "/api/v1/trips/"

    def setUp(self):
        self.client = Client()
        User.drop_collection()
        Trip.drop_collection()
        self.token = self._register("amelia@example.com")
        self.other_token = self._register("ben@example.com")
        self.trip_id = self._make_trip()

    def tearDown(self):
        User.drop_collection()
        Trip.drop_collection()

    def _register(self, email):
        response = self.client.post(
            self.register_url,
            {"email": email, "password": PASSWORD},
            content_type="application/json",
        )
        assert response.status_code == 201, response.content
        # Simulate the required email OTP verification before signing in.
        user = User.objects(email=email).first()
        if user is not None:
            user.modify(email_verified=True, is_active=True, otp_hash="")
        login = self.client.post(
            "/api/v1/auth/login/",
            {"email": email, "password": PASSWORD},
            content_type="application/json",
        )
        assert login.status_code == 200, login.content
        return login.json()["data"]["tokens"]["access"]

    def _make_trip(self, notes="Secret planning notes."):
        self.client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {self.token}"
        response = self.client.post(
            self.trips_url,
            {
                "title": "Venice Escape",
                "destination": "Venice",
                "start_date": "2027-07-01",
                "end_date": "2027-07-03",
                "notes": notes,
            },
            content_type="application/json",
        )
        assert response.status_code == 201, response.content
        return response.json()["data"]["trip"]["id"]

    def auth(self, token=None):
        self.client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {token or self.token}"
        return self.client


class ShareLinkTests(ShareBase, SimpleTestCase):
    SHARE_URL = "/api/v1/share/trips"

    def test_create_share_link(self):
        response = self.auth().post(f"{self.SHARE_URL}/{self.trip_id}/")
        self.assertEqual(response.status_code, 200)
        token = response.json()["data"]["token"]
        self.assertTrue(token)

    def test_public_view_is_anonymous_and_sanitised(self):
        token = self.auth().post(f"{self.SHARE_URL}/{self.trip_id}/").json()["data"]["token"]
        anonymous = Client().get(f"/api/v1/share/{token}/")
        body = anonymous.json()["data"]["trip"]
        self.assertEqual(anonymous.status_code, 200)
        self.assertEqual(body["destination"], "Venice")
        # Notes never leak to public viewers.
        self.assertNotIn("notes", body)

    def test_revoke_hides_trip(self):
        token = self.auth().post(f"{self.SHARE_URL}/{self.trip_id}/").json()["data"]["token"]
        self.auth().delete(f"{self.SHARE_URL}/{self.trip_id}/")
        response = Client().get(f"/api/v1/share/{token}/")
        self.assertEqual(response.status_code, 404)

    def test_foreign_user_cannot_share_others_trip(self):
        response = self.auth(self.other_token).post(f"{self.SHARE_URL}/{self.trip_id}/")
        self.assertEqual(response.status_code, 404)

    def test_invalid_token_404(self):
        response = Client().get("/api/v1/share/garbage-token/")
        self.assertEqual(response.status_code, 404)


EXPORT_PREFIX = "/api/v1/export/trips"


class ExportTests(ShareBase, SimpleTestCase):
    def _seed_days(self):
        """Add one activity day so exports have content."""
        self.auth().put(
            f"{self.trips_url}{self.trip_id}/days/1/",
            {
                "activities": [
                    {
                        "name": "St Mark's Basilica",
                        "start_time": "09:00",
                        "duration_minutes": 120,
                        "category": "museum",
                        "cost_estimate": "30.00",
                    }
                ]
            },
            content_type="application/json",
        )

    def test_pdf_endpoint_returns_pdf_attachment(self):
        self._seed_days()
        response = self.auth().get(f"{EXPORT_PREFIX}/{self.trip_id}/pdf/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/pdf")
        self.assertIn("attachment", response["Content-Disposition"])
        self.assertGreater(len(response.content), 500)  # real pages

    def test_ics_endpoint_returns_ics(self):
        self._seed_days()
        response = self.auth().get(f"{EXPORT_PREFIX}/{self.trip_id}/ics/")
        self.assertEqual(response.status_code, 200)
        body = response.content.decode("utf-8")
        self.assertIn("BEGIN:VCALENDAR", body)
        self.assertIn("BEGIN:VEVENT", body)

    def test_pdf_bytes_render_branded_content(self):
        self._seed_days()
        trip = Trip.objects(id=self.trip_id).first()
        data = build_trip_pdf_bytes(trip)
        self.assertTrue(data.startswith(b"%PDF"))
        self.assertGreater(len(data), 2000)

    def test_foreign_user_cannot_export(self):
        response = self.auth(self.other_token).get(f"{EXPORT_PREFIX}/{self.trip_id}/pdf/")
        self.assertEqual(response.status_code, 404)

    def test_ics_escaping(self):
        trip = Trip.objects(id=self.trip_id).first()
        from apps.trips.documents import Activity, Itinerary, ItineraryDay

        trip.itinerary = Itinerary(
            days=[
                ItineraryDay(
                    day_number=1,
                    date=trip.start_date,
                    activities=[
                        Activity(name="The,Comma;Place", start_time="10:00", duration_minutes=60)
                    ],
                )
            ]
        )
        data = build_trip_ics(trip)
        text = data.decode("utf-8")
        self.assertIn("The\\,Comma\\;Place", text)
        self.assertIn("BEGIN:VCALENDAR", text)