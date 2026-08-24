"""Conversation lifecycle + follow-up flow tests (mocked AI)."""
from django.test import Client, SimpleTestCase

from apps.planner.documents import Conversation, Message

from .base import CONVERSATIONS_URL, PlannerTestBase


def _register_second_user():
    other = Client()
    reg = other.post(
        "/api/v1/auth/register/",
        {"email": "ben@example.com", "password": "Sup3r-Secret-Pass!"},
        content_type="application/json",
    )
    token = reg.json()["data"]["tokens"]["access"]
    other.defaults["HTTP_AUTHORIZATION"] = f"Bearer {token}"
    return other


class ConversationCrudTests(PlannerTestBase, SimpleTestCase):
    def test_requires_authentication(self):
        response = self.client.get(CONVERSATIONS_URL)
        self.assertEqual(response.status_code, 401)

    def test_create_starts_with_greeting(self):
        response = self.auth_client().post(
            CONVERSATIONS_URL, content_type="application/json"
        )
        body = response.json()
        self.assertEqual(response.status_code, 201)
        self.assertEqual(body["data"]["messages"][0]["role"], "assistant")

    def test_list_returns_only_own_conversations(self):
        self.create_conversation()
        other = _register_second_user()
        data = other.get(CONVERSATIONS_URL).json()["data"]
        self.assertEqual(data["count"], 0)

    def test_foreign_conversation_hidden_on_detail_and_messages(self):
        conversation_id = self.create_conversation()
        other = _register_second_user()
        self.assertEqual(
            other.get(f"{CONVERSATIONS_URL}{conversation_id}/").status_code, 404
        )
        self.assertEqual(
            other.get(f"{CONVERSATIONS_URL}{conversation_id}/messages/").status_code,
            404,
        )

    def test_delete_removes_messages(self):
        conversation_id = self.create_conversation()
        response = self.auth_client().delete(f"{CONVERSATIONS_URL}{conversation_id}/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Message.objects.count(), 0)
        self.assertIsNone(Conversation.objects(id=conversation_id).first())


class FollowUpFlowTests(PlannerTestBase, SimpleTestCase):
    def test_destination_question_when_unknown(self):
        conversation_id = self.create_conversation()
        with self.mocked_ai({"extract": {}, "itinerary": None}):
            response = self.send_message(conversation_id, "I want to plan a trip!")
        data = response.json()["data"]
        assistant = data["assistant_message"]
        self.assertEqual(assistant["meta"]["type"], "clarification")
        self.assertIn("destination", assistant["meta"]["missing"])
        self.assertIn("destination", assistant["content"].lower())
        self.assertNotIn("trip", data)

    def test_duration_question_after_destination(self):
        conversation_id = self.create_conversation()
        with self.mocked_ai({"extract": {"destination": "Turkey"}, "itinerary": None}):
            first = self.send_message(conversation_id, "I want to visit Turkey.")
        meta = first.json()["data"]["assistant_message"]["meta"]
        self.assertEqual(meta["type"], "clarification")
        self.assertEqual(meta["missing"], ["duration_days"])
        # Requirements must persist in the conversation state.
        conversation = Conversation.objects(id=conversation_id).first()
        self.assertEqual(conversation.requirements.get("destination"), "Turkey")

    def test_empty_message_rejected(self):
        conversation_id = self.create_conversation()
        response = self.send_message(conversation_id, "   ")
        self.assertEqual(response.status_code, 400)

    def test_overlong_message_rejected(self):
        conversation_id = self.create_conversation()
        response = self.send_message(conversation_id, "x" * 4001)
        self.assertEqual(response.status_code, 400)
