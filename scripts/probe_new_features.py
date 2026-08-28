"""In-process validation of new endpoints using Django's test client."""
import json
import os
import sys
from datetime import date, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + "/backend")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")

import django  # noqa: E402

django.setup()

from rest_framework.test import APIClient  # noqa: E402

client = APIClient()


def show(label, response):
    try:
        body = response.json().get("data")
    except Exception:
        body = response.content[:150]
    print(f"[{response.status_code}] {label}: {json.dumps(body, default=str)[:260]}")


def main():
    # Public config (no auth)
    show("config/public", client.get("/api/v1/config/public/"))

    # Login + attach JWT
    login = client.post(
        "/api/v1/auth/login/",
        {"email": "demo@wandersync.test", "password": "Demo@12345"},
        format="json",
    )
    print(f"[{login.status_code}] login")
    if login.status_code != 200:
        print(login.content[:200])
        return
    tokens = login.json()["data"]["tokens"]
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")

    # Weather aligned to an arrival date ~3 days out (real Open-Meteo call).
    arrival = (date.today() + timedelta(days=3)).isoformat()
    show(
        f"weather (start={arrival})",
        client.get(f"/api/v1/weather/?lat=41.0082&lon=28.9784&days=3&start={arrival}"),
    )

    trip_list = client.get("/api/v1/trips/").json()["data"]
    results = trip_list.get("results", [])
    if not results:
        print("no trips available for geocode probe")
        return
    trip_id = results[0]["id"]
    detail = client.get(f"/api/v1/trips/{trip_id}/").json()["data"]["trip"]
    acts = [a for d in detail["itinerary"]["days"] for a in d["activities"]]
    missing_before = sum(1 for a in acts if not a.get("coordinates") or a["coordinates"].get("lat") is None)
    print(f"trip '{detail['title']}': {len(acts)} activities, {missing_before} without coordinates")

    show("geocode", client.post(f"/api/v1/trips/{trip_id}/geocode/", data="{}", content_type="application/json"))
    refreshed = client.get(f"/api/v1/trips/{trip_id}/").json()["data"]["trip"]
    acts2 = [a for d in refreshed["itinerary"]["days"] for a in d["activities"]]
    missing_after = sum(1 for a in acts2 if not a.get("coordinates") or a["coordinates"].get("lat") is None)
    print(f"after geocode: {missing_after} activities still without coordinates")


if __name__ == "__main__":
    main()
