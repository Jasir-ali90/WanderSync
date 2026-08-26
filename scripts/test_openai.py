"""Directly test the OpenAI key from backend/.env (no secrets printed)."""
import os
import sys

BACKEND_DIR = os.path.abspath(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "backend")
)
sys.path.insert(0, BACKEND_DIR)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")

import django  # noqa: E402

django.setup()

from django.conf import settings  # noqa: E402

key = settings.OPENAI_API_KEY
print("KEY loaded:", bool(key), "| length:", len(key or ""), "| prefix:", (key or "")[:7])

if not key:
    print("No key in settings — .env not being read? Check file location/name.")
    sys.exit(1)

from openai import OpenAI  # noqa: E402

client = OpenAI(api_key=key, timeout=20)
try:
    response = client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[
            {"role": "system", "content": "Reply with valid JSON only."},
            {"role": "user", "content": 'Return {"ok": true}'},
        ],
        response_format={"type": "json_object"},
        max_tokens=20,
    )
    print("MODEL:", settings.OPENAI_MODEL)
    print("RESPONSE OK:", response.choices[0].message.content)
except Exception as exc:
    print(f"OPENAI CALL FAILED: {exc.__class__.__name__}: {str(exc)[:400]}")