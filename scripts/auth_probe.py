"""Quick reproduction of auth flow against the live dev server."""
import requests

BASE = "http://127.0.0.1:8000/api/v1"

for email, password in [
    ("demo@wandersync.test", "Demo@12345"),
    ("admin@wandersync.test", "Admin@12345"),
]:
    r = requests.post(
        f"{BASE}/auth/login/",
        json={"email": email, "password": password},
        timeout=15,
    )
    status = "OK" if r.status_code == 200 else "FAIL"
    print(f"LOGIN {email}: {r.status_code} {status}")

