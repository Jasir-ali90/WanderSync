"""Verify demo account logins using Django's in-process client."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

import django  # noqa: E402

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")
django.setup()

from django.test import Client  # noqa: E402

client = Client()
for email, password in [
    ("demo@wandersync.test", "Demo@12345"),
    ("admin@wandersync.test", "Admin@12345"),
]:
    r = client.post(
        "/api/v1/auth/login/",
        {"email": email, "password": password},
        content_type="application/json",
    )
    print(f"LOGIN {email}: {r.status_code} {'OK' if r.status_code == 200 else 'FAIL'}")

# A full register -> login cycle for a brand new user too.
r = client.post(
    "/api/v1/auth/register/",
    {"email": "fresh.user@test.com", "full_name": "Fresh", "password": "Fresh@12345"},
    content_type="application/json",
)
print("REGISTER fresh.user@test.com:", r.status_code)
r = client.post(
    "/api/v1/auth/login/",
    {"email": "fresh.user@test.com", "password": "Fresh@12345"},
    content_type="application/json",
)
print("LOGIN fresh.user@test.com:", r.status_code)
