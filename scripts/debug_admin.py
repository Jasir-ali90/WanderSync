"""Reproduce admin stats failure with a visible traceback."""
import os
import sys

BACKEND_DIR = os.path.abspath(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "backend")
)
sys.path.insert(0, BACKEND_DIR)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")

import django  # noqa: E402

django.setup()

from django.test import Client  # noqa: E402

from apps.accounts.documents import User  # noqa: E402

admin = User.objects(email="admin@wandersync.test").first()
print("admin found:", bool(admin), "is_staff:", getattr(admin, "is_staff", None))

client = Client()
login = client.post(
    "/api/v1/auth/login/",
    {"email": "admin@wandersync.test", "password": "Admin@12345"},
    content_type="application/json",
)
print("LOGIN:", login.status_code)

response = client.get("/api/v1/admin/stats/")
print("STATS:", response.status_code)
if response.status_code != 200:
    import traceback

    # The dev server logs the traceback; here we call the view logic directly.
    try:
        from apps.accounts.services import issue_tokens
        from rest_framework.test import APIRequestFactory, force_authenticate

        factory = APIRequestFactory()
        request = factory.get("/api/v1/admin/stats/")
        force_authenticate(request, user=admin)
        from apps.adminpanel.views import AdminStatsView

        view = AdminStatsView.as_view()
        response = view(request)
        print("DIRECT VIEW:", response.status_code)
        if response.status_code != 200:
            response.render()
            print(response.content[:300])
    except Exception:
        traceback.print_exc()