"""Itinerary-generation pipeline tests (mocked AI, incl. failure modes)."""
from unittest import mock

from django.test import SimpleTestCase

from apps.planner.documents import Conversation
from apps.trips.documents import Trip

from .base import CONVERSATIONS_URL, VALID_ITINERARY, PlannerTestBase


FULL_REQUEST = (
    "Plan a 2-day cultural trip to Italy for 2 people with a $1500 budget. "
    "We love museums and food."
)

FULL_EXTRACTION = {
    "destination": "Italy",
    "duration_days": 2,
    "travelers": 2,
    "budget_amount": 1500,
    "budget_currency": "USD",
    "interests": ["museums", "food"],
}


class ItineraryGenerationTests(PlannerTestBase, SimpleTestCase):
    def test_full_flow_creates_trip(self):
        conversation_id = self.create_conversation()
        two_day_itinerary = {
            "destination": "Italy",
            "days": [
                VALID_ITINERARY["days"][0],
                {**VALID_ITINERARY["days"][0], "day_number": 2},
            ],
        }
        with self.mocked_ai(
            {"extract": FULL_EXTRACTION, "itinerary": two_day_itinerary}
        ):
            response = self.send_message(conversation_id, FULL_REQUEST)
        data = response.json()["data"]
        assistant = data["assistant_message"]
        self.assertEqual(assistant["meta"]["type"], "itinerary_generated")
        trip_payload = data["trip"]
        self.assertEqual(trip_payload["duration_days"], 2)
        self.assertEqual(len(trip_payload["itinerary"]["days"]), 2)
        persisted = Trip.objects(id=trip_payload["id"]).first()
        self.assertIsNotNone(persisted)
        self.assertEqual(persisted.status, "planned")
        self.assertGreater(persisted.itinerary.total_estimated_cost(), 0)

    def test_demo_engine_used_without_openai_key(self):
        conversation_id = self.create_conversation()
        # No key configured in tests -> extraction yields nothing -> demo path.
        with self.mocked_ai({"extract": {}, "itinerary": None}):
            response = self.send_message(
                conversation_id,
                "Plan a 3-day trip to Italy with a $1500 budget for 2 people.",
            )
        meta = response.json()["data"]["assistant_message"]["meta"]
        self.assertIn("demo", meta.get("engine", ""))

    def test_invalid_ai_itinerary_falls_back_to_demo_after_retry(self):
        conversation_id = self.create_conversation()
        calls = {"itinerary": 0}

        def flaky_complete(system_prompt, user_prompt, **kwargs):
            if "itinerary planner" in system_prompt:
                calls["itinerary"] += 1
                return {"not": "a valid itinerary"}  # schema-invalid payload
            return dict(FULL_EXTRACTION)

        with (
            mock.patch("apps.ai.orchestrator.openai_client.is_enabled", new=lambda: True),
            mock.patch(
                "apps.ai.orchestrator.openai_client.complete_json",
                side_effect=flaky_complete,
            ),
        ):
            response = self.send_message(conversation_id, FULL_REQUEST)

        body = response.json()["data"]["assistant_message"]
        self.assertEqual(calls["itinerary"], 2)  # initial attempt + one retry
        self.assertEqual(body["meta"]["engine"], "demo")  # graceful fallback
        self.assertIn("demo", body["content"])

    def test_ai_transport_failure_returns_friendly_error(self):
        conversation_id = self.create_conversation()

        def boom(system_prompt, user_prompt, **kwargs):
            raise ConnectionError("network down")

        with (
            mock.patch("apps.ai.orchestrator.openai_client.is_enabled", new=lambda: True),
            mock.patch(
                "apps.ai.orchestrator.openai_client.complete_json",
                side_effect=boom,
            ),
        ):
            response = self.send_message(conversation_id, FULL_REQUEST)

        body = response.json()
        self.assertEqual(response.status_code, 200)  # never a 500 to the user
        self.assertEqual(body["data"]["assistant_message"]["meta"]["type"], "error")

    def test_requirements_accumulate_across_messages(self):
        conversation_id = self.create_conversation()
        with self.mocked_ai({"extract": {"destination": "Turkey"}, "itinerary": None}):
            self.send_message(conversation_id, "I want to visit Turkey.")
        with self.mocked_ai({"extract": {"duration_days": 6}, "itinerary": None}):
            self.send_message(conversation_id, "6 days.")

        conversation = Conversation.objects(id=conversation_id).first()
        self.assertEqual(conversation.requirements.get("destination"), "Turkey")
        self.assertEqual(conversation.requirements.get("duration_days"), 6)

    def test_message_history_persisted_in_order(self):
        conversation_id = self.create_conversation()
        with self.mocked_ai({"extract": {"destination": "Japan"}, "itinerary": None}):
            self.send_message(conversation_id, "Trip to Japan please.")
        messages = (
            self.auth_client()
            .get(f"{CONVERSATIONS_URL}{conversation_id}/messages/")
            .json()["data"]["results"]
        )
        roles = [m["role"] for m in messages]
        self.assertEqual(roles[0], "assistant")  # greeting
        self.assertEqual(roles[-2:], ["user", "assistant"])

    def test_generated_trip_appears_in_owners_trip_list(self):
        conversation_id = self.create_conversation()
        with self.mocked_ai(
            {"extract": FULL_EXTRACTION, "itinerary": VALID_ITINERARY}
        ):
            response = self.send_message(conversation_id, FULL_REQUEST)
        trip_payload = response.json()["data"]["trip"]
        listing = self.auth_client().get("/api/v1/trips/").json()["data"]
        ids = [t["id"] for t in listing["results"]]
        self.assertIn(trip_payload["id"], ids)
