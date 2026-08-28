"""Inspect existing users and test their logins."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

import django  # noqa: E402

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")
django.setup()

from apps.accounts.documents import User  # noqa: E402

print("USERS IN DB:")
for u in User.objects[:20]:
    print(" -", u.email, "| active:", u.is_active, "| staff:", u.is_staff)

# Try login for each known user with candidate passwords.
from apps.accounts.services import authenticate_user  # noqa: E402

candidates = ["Test1234!", "Demo@12345", "Admin@12345", "VipTest123!", "Sup3r-Secret-Pass!"]
for u in User.objects[:20]:
    matched = [p for p in candidates if authenticate_user(email=u.email, password=p)]
    print(u.email, "->", matched or "NO MATCH")

