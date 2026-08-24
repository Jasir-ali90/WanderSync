"""Quick manual check of local extraction (dev helper)."""
import os
import sys

BACKEND_DIR = os.path.abspath(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "backend")
)
sys.path.insert(0, BACKEND_DIR)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.test")

import django  # noqa: E402

django.setup()


from apps.ai.local_extract import extract_local  # noqa: E402

for text in [
    "I want to visit Turkey.",
    "Plan a 3-day trip to Italy with a $1500 budget for 2 people.",
    "Six days.",
]:
    patch = extract_local(text)
    print(text, "->", patch.model_dump() if patch else None)
