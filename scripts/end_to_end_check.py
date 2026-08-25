"""Smoke: register via the Vite proxy exactly as the browser would."""
import sys

import requests

BASE = "http://localhost:5173/api/v1"

session = requests.Session()

register = session.post(
    f"{BASE}/auth/register/",
    json={
        "email": "smoke@wandersync.test",
        "password": "SmokeTest123!",
        "full_name": "Smoke Test",
    },
    timeout=10,
)
print("REGISTER:", register.status_code)
assert register.status_code == 201, register.text

tokens = register.json()["data"]["tokens"]
auth = {"Authorization": f"Bearer {tokens['access']}"}

me = session.get(f"{BASE}/auth/me/", headers=auth, timeout=10)
print("ME:", me.status_code, me.json()["data"]["user"]["email"])

conversation = session.post(
    f"{BASE}/planner/conversations/", headers=auth, timeout=15
)
print("CONVERSATION:", conversation.status_code)

reply = session.post(
    f"{BASE}/planner/conversations/{conversation.json()['data']['conversation']['id']}/messages/",
    headers=auth,
    json={"content": "Plan a 3-day trip to Rome with a $800 budget for 2 people."},
    timeout=60,
)
data = reply.json()["data"]
print("PLANNER:", reply.status_code, "->", data["assistant_message"]["content"][:90], "...")

trips = session.get(f"{BASE}/trips/", headers=auth, timeout=10).json()["data"]
print("TRIPS:", trips["count"])
assert trips["count"] >= 1

weather = session.get(
    f"{BASE}/weather/?lat=41.9&lon=12.5&days=2", headers=auth, timeout=15
).json()["data"]
print("WEATHER source:", weather["source"], "-", weather["current"]["condition"])

print("SMOKE OK")
sys.exit(0)
