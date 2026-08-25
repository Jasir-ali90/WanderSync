"""Phase 13 smoke: studio editing, regenerate, share, exports via the proxy."""
import sys

import requests

BASE = "http://localhost:5173/api/v1"

session = requests.Session()

register = session.post(
    f"{BASE}/auth/register/",
    json={
        "email": "studio@wandersync.test",
        "password": "StudioTest123!",
        "full_name": "Studio Tester",
    },
    timeout=10,
)
if register.status_code != 201:
    # Account persists from earlier smoke runs; sign in instead.
    register = session.post(
        f"{BASE}/auth/login/",
        json={"email": "studio@wandersync.test", "password": "StudioTest123!"},
        timeout=10,
    )
print("REGISTER/LOGIN:", register.status_code)
assert register.status_code in (200, 201), register.text

tokens = register.json()["data"]["tokens"]
auth = {"Authorization": f"Bearer {tokens['access']}"}

trip_id = session.post(
    f"{BASE}/trips/",
    headers=auth,
    json={
        "title": "Rome Studio Trip",
        "destination": "Rome",
        "start_date": "2027-09-10",
        "end_date": "2027-09-12",
        "budget_amount": 900,
        "budget_currency": "EUR",
        "interests": ["museums"],
    },
    timeout=10,
).json()["data"]["trip"]["id"]
print("TRIP:", trip_id)

add = session.post(
    f"{BASE}/trips/{trip_id}/days/1/activities/",
    headers=auth,
    json={
        "name": "Vatican Museums",
        "start_time": "09:00",
        "duration_minutes": 150,
        "category": "museum",
        "cost_estimate": 27,
    },
    timeout=10,
)
print("ADD ACTIVITY:", add.status_code)

regen = session.post(
    f"{BASE}/trips/{trip_id}/days/2/regenerate/",
    headers=auth,
    json={"mood": "relaxed"},
    timeout=30,
)
regen_data = regen.json()["data"]
print("REGENERATE:", regen.status_code, "engine:", regen_data["engine"],
      "| day-2 activities:", len(regen_data["trip"]["itinerary"]["days"][1]["activities"]))

share = session.post(f"{BASE}/share/trips/{trip_id}/", headers=auth, timeout=10).json()["data"]
print("SHARE token:", share["token"][:12], "...")
public = requests.get(f"{BASE}/share/{share['token']}/", timeout=10).json()["data"]["trip"]
print("PUBLIC VIEW: destination =", public["destination"], "| notes leaked:", "notes" in public)

pdf = session.get(f"{BASE}/export/trips/{trip_id}/pdf/", headers=auth, timeout=15)
ics = session.get(f"{BASE}/export/trips/{trip_id}/ics/", headers=auth, timeout=15)
print("PDF:", pdf.status_code, pdf.headers["Content-Type"], len(pdf.content), "bytes")
print("ICS:", ics.status_code, "VEVENTs:", ics.content.count(b"BEGIN:VEVENT"))

print("STUDIO SMOKE OK")
sys.exit(0)