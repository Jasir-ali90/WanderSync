"""Live AI test: real Groq/LLM round-trip through the app's client."""
import os
import sys

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

import django  # noqa: E402

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")
django.setup()

from integrations.openai import client as ai_client  # noqa: E402

result = ai_client.complete_json(
    system_prompt=(
        "You are a travel planning assistant. Reply ONLY with a JSON object "
        'with keys "greeting" (short friendly line) and "suggested_spot" '
        "(a famous city name)."
    ),
    user_prompt="Greet a traveller and suggest one famous spot.",
    temperature=0.4,
    max_tokens=2000,
)

if result is None:
    print("AI CALL FAILED — check logs above for the reason.")
else:
    print("AI CALL OK ✅")
    print("Response:", result)

