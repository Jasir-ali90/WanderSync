"""Phase-1 smoke test: exercise the health endpoint via the Django test client.

Usage: python manage.py shell < scripts/smoke_health.py
"""
from django.test import Client

response = Client().get("/api/v1/health/")
print("STATUS:", response.status_code)
print("BODY:", response.content.decode())

assert response.status_code == 200, "health endpoint must return 200"
body = response.json()
assert body["success"] is True, "envelope success flag missing"
print("SMOKE OK")
