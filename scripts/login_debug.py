"""Directly verify the demo accounts exist and their passwords hash correctly."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + "/backend")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")

import django  # noqa: E402

django.setup()

from apps.accounts.documents import User  # noqa: E402
from django.contrib.auth.hashers import check_password  # noqa: E402

for email in ["demo@wandersync.test", "admin@wandersync.test"]:
    user = User.objects(email=email).first()
    if not user:
        print(f"{email}: NOT FOUND")
        continue
    print(
        f"{email}: found | Demo@12345={check_password('Demo@12345', user.password)}"
        f" | Admin@12345={check_password('Admin@12345', user.password)}"
    )
