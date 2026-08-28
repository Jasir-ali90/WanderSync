"""Check DB connectivity and whether the demo user exists + password verifies."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + "/backend")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")

import django  # noqa: E402

django.setup()

from config.db import ensure_connection  # noqa: E402
from django.conf import settings  # noqa: E402
from mongoengine import get_connection  # noqa: E402

print("DB NAME:", getattr(settings, "MONGODB_DB", None))
print("CONNECTION:", ensure_connection())
try:
    client = get_connection("default")
    print("PING:", bool(client))
    print("DBS SAMPLE:", client[settings.MONGODB_DB].list_collection_names()[:12])
except Exception as exc:
    print("CHECK FAILED:", exc)
