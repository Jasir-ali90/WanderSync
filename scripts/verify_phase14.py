"""Phase 14 smoke: verify OpenAI engine + admin + spots via the proxy."""
import sys

import requests

BASE = "http://localhost:5173/api/v1"

session = requests.Session()

login = session.post(
    f"{BASE}/auth/login/",
    json={"email": "demo@wandersync.test", "password": "Demo@12345"},
    timeout=15,
)
print("DEMO LOGIN:", login.status_code)
assert login.status_code == 200, login.text

tokens = login.json()["data"]["tokens"]
auth = {"Authorization": f"Bearer {tokens['access']}"}

conversation = session.post(
    f"{BASE}/planner/conversations/", headers=auth, timeout=15
)
conversation_id = conversation.json()["data"]["conversation"]["id"]

reply = session.post(
    f"{BASE}/planner/conversations/{conversation_id}/messages/",
    headers=auth,
    json={"content": "Plan a 2-day trip to Istanbul for 2 people with a $700 budget."},
    timeout=90,
)
data = reply.json()["data"]["assistant_message"]
meta = data["meta"]
engine = meta.get("engine", "(clarification/error)")
print("ENGINE:", engine)
print("REPLY:", data["content"][:120].replace("\n", " "), "...")

# History persisted? Reload conversation and count messages.
history = session.get(
    f"{BASE}/planner/conversations/{conversation_id}/", headers=auth, timeout=10
).json()["data"]["messages"]
print("HISTORY SAVED:", len(history), "messages")

# Spots catalog (user-level)
spots = session.get(f"{BASE}/spots/", headers=auth, timeout=10).json()["data"]
print("SPOTS countries:", spots["count"])

# Admin gate: demo user must be rejected
denied = session.get(f"{BASE}/admin/stats/", headers=auth, timeout=10)
print("NON-STAFF admin:", denied.status_code, "(expect 403)")

# Admin login + stats
admin_login = requests.post(
    f"{BASE}/auth/login/",
    json={"email": "admin@wandersync.test", "password": "Admin@12345"},
    timeout=15,
)
admin_auth = {"Authorization": f"Bearer {admin_login.json()['data']['tokens']['access']}"}
stats = requests.get(f"{BASE}/admin/stats/", headers=admin_auth, timeout=10).json()["data"]
print("ADMIN STATS: users=%s trips=%s ai_enabled=%s" % (
    stats["total_users"], stats["total_trips"], stats["ai_enabled"],
))

if engine != "openai":
    print("NOTE: engine is not openai — check OPENAI_API_KEY validity/quota.")
else:
    print("LIVE AI CONFIRMED")
sys.exit(0)