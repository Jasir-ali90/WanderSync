"""Debug: inspect planner meta for the failing demo-engine test."""
import os
import sys

BACKEND_DIR = os.path.abspath(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "backend")
)
sys.path.insert(0, BACKEND_DIR)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.test")

import django  # noqa: E402

django.setup()

from django.conf import settings  # noqa: E402

print("OPENAI_API_KEY set:", bool(settings.OPENAI_API_KEY))

from django.test import Client  # noqa: E402

from apps.accounts.documents import User  # noqa: E402
from apps.trips.documents import Trip  # noqa: E402

User.drop_collection()
Trip.drop_collection()
client = Client()
reg = client.post(
    "/api/v1/auth/register/",
    {"email": "dbg2@example.com", "password": "Sup3r-Secret-Pass!"},
    content_type="application/json",
)
token = reg.json()["data"]["tokens"]["access"]
client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {token}"

conversation = client.post("/api/v1/planner/conversations/", content_type="application/json")
conversation_id = conversation.json()["data"]["conversation"]["id"]

reply = client.post(
    f"/api/v1/planner/conversations/{conversation_id}/messages/",
    {"content": "Plan a 3-day trip to Italy with a $1500 budget for 2 people."},
    content_type="application/json",
)
body = reply.json()["data"]["assistant_message"]
print("STATUS:", reply.status_code)
print("META:", body["meta"])
print("CONTENT:", body["content"][:120])

User.drop_collection()
Trip.drop_collection()