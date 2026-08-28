"""Shared fixtures for planner integration tests.

The OpenAI client is mocked so tests are deterministic and never hit the
network. ``mock_complete`` lets each test script AI responses precisely.
"""
from contextlib import contextmanager
from unittest import mock

from django.test import Client

from apps.accounts.documents import User
from apps.planner.documents import Conversation, Message
from apps.trips.documents import Trip

PASSWORD = "Sup3r-Secret-Pass!"  # noqa: S105 - fixture only
CONVERSATIONS_URL = "/api/v1/planner/conversations/"

# A schema-valid itinerary the "AI" returns in happy-path tests.
VALID_ITINERARY = {
    "destination": "Italy",
    "days": [
        {
            "day_number": 1,
            "title": "Arrival in Rome",
            "activities": [
                {
                    "name": "Colosseum guided visit",
                    "description": "Skip-the-line morning tour.",
                    "start_time": "09:00",
                    "duration_minutes": 120,
                    "location_name": "Rome",
                    "category": "museum",
                    "cost_estimate": 25,
                },
                {
                    "name": "Trastevere food walk",
                    "start_time": "18:30",
                    "duration_minutes": 150,
                    "category": "food",
                    "cost_estimate": 40,
                },
            ],
        }
    ],
}


def valid_extraction(raw: dict | None = None):
    """Return a fake complete_json for requirements extraction."""
    payload = raw or {"destination": "Italy"}
    return payload


class PlannerTestBase:
    def setUp(self):
        self.client = Client()
        User.drop_collection()
        Conversation.drop_collection()
        Message.drop_collection()
        Trip.drop_collection()
        self.token = self._register_and_login("amelia@example.com")
        self._patches = []

    def tearDown(self):
        for patcher in self._patches:
            patcher.stop()
        User.drop_collection()
        Conversation.drop_collection()
        Message.drop_collection()
        Trip.drop_collection()

    def _register_and_login(self, email: str) -> str:
        response = self.client.post(
            "/api/v1/auth/register/",
            {"email": email, "full_name": email.split("@")[0].title(), "password": PASSWORD},
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

    def auth_client(self):
        self.client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {self.token}"
        return self.client

    @contextmanager
    def mocked_ai(self, responses: dict):
        """Patch complete_json to answer per system-prompt substring.

        ``responses`` maps a substring of the user prompt ('extract' or
        'itinerary') to either a dict (returned as parsed JSON) or an
        exception instance (raised, simulating transport failure).
        """

        def fake_complete(system_prompt, user_prompt, **kwargs):
            key = "itinerary" if "itinerary planner" in system_prompt else "extract"
            value = responses[key]
            if isinstance(value, Exception):
                raise value
            return value

        patcher = mock.patch(
            "integrations.openai.client.complete_json", side_effect=fake_complete
        )
        # The orchestrator resolved the symbol at import; patch where used.
        patcher2 = mock.patch("apps.ai.orchestrator.openai_client.complete_json", new=fake_complete)
        patcher.start()
        patcher2.start()
        self._patches.extend([patcher, patcher2])
        yield

    def create_conversation(self) -> str:
        response = self.auth_client().post(CONVERSATIONS_URL, content_type="application/json")
        assert response.status_code == 201, response.content
        return response.json()["data"]["conversation"]["id"]

    def send_message(self, conversation_id: str, content: str):
        return self.auth_client().post(
            f"{CONVERSATIONS_URL}{conversation_id}/messages/",
            {"content": content},
            content_type="application/json",
        )
