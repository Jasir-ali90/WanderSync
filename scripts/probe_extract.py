import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

import django  # noqa: E402

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")
django.setup()

from apps.ai.local_extract import extract_local  # noqa: E402

msg = "Plan a 2-day trip to Rome with a $500 budget for 2 people."
print("local:", extract_local(msg))

from apps.ai import openai_client  # noqa: E402

print("ai_enabled:", openai_client.is_enabled())
try:
    print("live:", openai_client.complete_json("reply with {}", "hello", temperature=0))
except Exception as exc:  # noqa: BLE001
    print("live error type:", type(exc).__name__, str(exc)[:200])