"""Verify admin login + AI key status via the admin stats endpoint."""
import requests

BASE = "http://localhost:5173/api/v1"

login = requests.post(
    f"{BASE}/auth/login/",
    json={"email": "admin@wandersync.test", "password": "Admin@12345"},
    timeout=15,
)
print("ADMIN LOGIN:", login.status_code)
assert login.status_code == 200, login.text

tokens = login.json()["data"]["tokens"]
auth = {"Authorization": f"Bearer {tokens['access']}"}
stats_response = requests.get(f"{BASE}/admin/stats/", headers=auth, timeout=10)
if stats_response.status_code != 200:
    print("ADMIN STATS FAILED:", stats_response.status_code, stats_response.text[:300])
    raise SystemExit(1)
stats = stats_response.json()["data"]
print("STATS:", {
    k: stats[k] for k in (
        "total_users", "total_trips", "total_conversations", "ai_generations", "ai_enabled"
    )
})
print("TOP DEST:", stats["top_destinations"][:3])

# Staff-only guard: normal user must be rejected.
user_login = requests.post(
    f"{BASE}/auth/login/",
    json={"email": "demo@wandersync.test", "password": "Demo@12345"},
    timeout=15,
)
user_auth = {"Authorization": f"Bearer {user_login.json()['data']['tokens']['access']}"}
denied = requests.get(f"{BASE}/admin/stats/", headers=user_auth, timeout=10)
print("NON-STAFF /admin/stats/:", denied.status_code, "(expect 403)")

# Spots catalog
spots = requests.get(f"{BASE}/spots/", headers=auth, timeout=10).json()["data"]
print("SPOTS countries:", spots["count"])
assert spots["count"] >= 6
print("ADMIN+SPOTS OK")