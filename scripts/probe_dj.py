"""Endpoint validation via Django's test client (no live server needed).

Covers: public config, arrival-date weather, trip geocoding.
Run:  .venv\\Scripts\\python.exe ..\\scripts\\probe_dj.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + "/backend")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")

import json  # noqa: E402

import django  # noqa: E402

django.setup()

from django.test import Client  # noqa: E402


def body(response):
    try:
        payload = response.json()
    except Exception:
        return {"raw": response.content[:120].decode(errors="replace")}
    data = payload.get("data", payload)
    return {"message": payload.get("message"), "data": data}


def main():
    client = Client()

    # -- Login first (weather/places/trips are authenticated) -----------------
    response = client.post(
        "/api/v1/auth/login/",
        data=json.dumps({"email": "demo@wandersync.test", "password": "Demo@12345"}),
        content_type="application/json",
    )
    print(f"[{response.status_code}] login demo user")
    payload = response.json().get("data", {})
    token = (
        payload.get("access")
        or payload.get("access_token")
        or payload.get("token")
        or ""
    )
    if not token and isinstance(payload.get("tokens"), dict):
        token = payload["tokens"].get("access") or ""
    assert token, f"no bearer token in login response keys={list(payload)}"
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {token}"

    # -- Public config ------------------------------------------------------
    anon = Client()
    response = anon.get("/api/v1/config/public/")
    info = body(response)
    maps_enabled = bool((info.get("data") or {}).get("google_maps_key"))
    print(f"[{response.status_code}] config/public -> google_maps_key present: {maps_enabled}")

    # -- Weather aligned to an arrival date ----------------------------------
    response = client.get(
        "/api/v1/weather/?lat=41.0082&lon=28.9784&days=3&start=2026-09-02"
    )
    info = body(response)
    data = info.get("data") or {}
    forecast = data.get("forecast", [])
    dates = [day.get("date") for day in forecast]
    print(
        f"[{response.status_code}] weather(start=2026-09-02) -> source={data.get('source')} "
        f"dates={dates}"
    )
    assert dates and dates[0] >= "2026-09-01", "forecast window not aligned to arrival date"

    # -- Trip geocoding -------------------------------------------------------
    response = client.get("/api/v1/trips/")
    results = (body(response).get("data") or {}).get("results", [])
    print(f"[{response.status_code}] trips list -> {len(results)} trip(s)")
    if not results:
        print("SKIP geocode probe: no trips for demo user")
        return

    trip_id = results[0]["id"]
    detail = client.get(f"/api/v1/trips/{trip_id}/").json()["data"]["trip"]
    acts = [a for d in detail["itinerary"]["days"] for a in d["activities"]]
    missing_before = sum(1 for a in acts if not a.get("coordinates") or a["coordinates"].get("lat") is None)
    print(f"trip '{detail['title']}': {len(acts)} activities, {missing_before} missing coordinates")

    response = client.post(f"/api/v1/trips/{trip_id}/geocode/")
    print(f"[{response.status_code}] geocode -> {body(response)}")

    refreshed = client.get(f"/api/v1/trips/{trip_id}/").json()["data"]["trip"]
    acts2 = [a for d in refreshed["itinerary"]["days"] for a in d["activities"]]
    missing_after = sum(1 for a in acts2 if not a.get("coordinates") or a["coordinates"].get("lat") is None)
    print(f"after geocode: {missing_after} still missing coordinates")

    # -- Weather without start param (backwards compatible) -------------------
    response = client.get("/api/v1/weather/?lat=48.8566&lon=2.3522&days=3")
    data = body(response).get("data") or {}
    print(f"[{response.status_code}] weather(no start) -> source={data.get('source')} days={len(data.get('forecast', []))}")

    print("ALL PROBES COMPLETED")


if __name__ == "__main__":
    main()
