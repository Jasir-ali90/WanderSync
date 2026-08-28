"""Shared fixtures for trips integration tests."""
from django.test import Client

from apps.accounts.documents import User
from apps.trips.documents import Trip

PASSWORD = "Sup3r-Secret-Pass!"  # noqa: S105 - test fixture only

TRIPS_URL = "/api/v1/trips/"

TRIP_A = {
    "title": "Cultural Italy Adventure",
    "destination": "Italy",
    "start_date": "2027-04-10",
    "end_date": "2027-04-16",
    "travelers": 2,
    "budget_amount": "2500.00",
    "budget_currency": "EUR",
    "budget_level": "moderate",
    "travel_style": "cultural",
    "interests": ["museums", "historical sites", "food"],
}

TRIP_B = {
    "title": "Dubai Weekend",
    "destination": "United Arab Emirates",
    "start_date": "2027-06-01",
    "end_date": "2027-06-03",
}


class TripsTestBase:
    """Two authenticated users + clean collections per test."""

    def setUp(self):
        self.client = Client()
        User.drop_collection()
        Trip.drop_collection()
        self.token_a = self._register_and_login("amelia@example.com")
        self.token_b = self._register_and_login("ben@example.com")

    def tearDown(self):
        User.drop_collection()
        Trip.drop_collection()

    def _register_and_login(self, email: str) -> str:
        register = self.client.post(
            "/api/v1/auth/register/",
            {"email": email, "full_name": email.split("@")[0].title(), "password": PASSWORD},
            content_type="application/json",
        )
        assert register.status_code == 201, register.content
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

    def _auth(self, token: str):
        self.client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {token}"
        return self.client

    def as_user_a(self):
        return self._auth(self.token_a)

    def as_user_b(self):
        return self._auth(self.token_b)

    def create_trip(self, payload=None, token=None) -> dict:
        client = self._auth(token or self.token_a)
        response = client.post(
            TRIPS_URL, payload or TRIP_A, content_type="application/json"
        )
        assert response.status_code == 201, response.content
        return response.json()["data"]["trip"]
