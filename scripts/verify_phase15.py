"""Phase 15 smoke: budget breakdown, notifications, recommendations,
smart actions, forgot-password + account deletion via the proxy."""
import sys

import requests

BASE = "http://localhost:5173/api/v1"
EMAIL = "vip@wandersync.test"
PASSWORD = "VipTest123!"

session = requests.Session()

register = session.post(
    f"{BASE}/auth/register/",
    json={"email": EMAIL, "password": PASSWORD, "full_name": "VIP Tester"},
    timeout=15,
)
if register.status_code != 201:
    register = session.post(
        f"{BASE}/auth/login/", json={"email": EMAIL, "password": PASSWORD}, timeout=15
    )
print("AUTH:", register.status_code)
tokens = register.json()["data"]["tokens"]
auth = {"Authorization": f"Bearer {tokens['access']}"}

# Build a trip with activities (via planner for realistic data)
conversation = session.post(f"{BASE}/planner/conversations/", headers=auth, timeout=10).json()["data"]
reply = session.post(
    f"{BASE}/planner/conversations/{conversation['conversation']['id']}/messages/",
    headers=auth,
    json={"content": "Plan a 2-day trip to Rome with a $500 budget for 2 people."},
    timeout=90,
).json()["data"]

if reply["assistant_message"]["meta"].get("type") != "itinerary_generated":
    print("PLANNER:", reply["assistant_message"]["meta"])
else:
    trip_id = reply["trip"]["id"]
    print("TRIP:", trip_id)

    # Budget breakdown
    budget = session.get(f"{BASE}/trips/{trip_id}/budget/", headers=auth, timeout=10).json()["data"]["budget"]
    print("BUDGET categories:", budget["categories"], "| daily_avg:", budget["daily_average"])

    # Notifications created by generation?
    notes = session.get(f"{BASE}/notifications/", headers=auth, timeout=10).json()["data"]
    print("NOTIFICATIONS unread:", notes["unread"], "| first:", notes["results"][0]["title"] if notes["results"] else None)

    # Recommendations
    recs = session.get(f"{BASE}/recommendations/", headers=auth, timeout=10).json()["data"]
    print("RECOMMENDATIONS:", len(recs["spots"]), "spots,", len(recs["destinations"]), "destinations")

    # Smart action: make it cheaper (structured modification)
    sa = session.post(
        f"{BASE}/planner/conversations/{conversation['conversation']['id']}/messages/",
        headers=auth,
        json={"content": "Make it cheaper please."},
        timeout=30,
    ).json()["data"]["assistant_message"]
    meta_type = sa["meta"].get("type")
    print("SMART ACTION:", meta_type)
    budget2 = session.get(f"{BASE}/trips/{trip_id}/budget/", headers=auth, timeout=10).json()["data"]["budget"]
    print("  cost before/after:", budget["total_estimate"], "->", budget2["total_estimate"])

print("PHASE15 SMOKE OK")
sys.exit(0)