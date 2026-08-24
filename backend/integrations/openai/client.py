"""OpenAI integration — the only place that talks to the OpenAI API.

Contract: ``complete_json`` returns a parsed dict, or ``None`` on any failure
(missing key, network error, timeout, malformed JSON). It NEVER raises into
calling services; callers decide how to degrade.
"""
import json
import logging

from django.conf import settings

logger = logging.getLogger(__name__)

REQUEST_TIMEOUT_SECONDS = 25


def is_enabled() -> bool:
    return bool(settings.OPENAI_API_KEY)


def _get_client():
    if not is_enabled():
        return None
    try:
        from openai import OpenAI

        return OpenAI(
            api_key=settings.OPENAI_API_KEY,
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
    except Exception as exc:  # pragma: no cover - SDK import issues
        logger.warning("OpenAI client unavailable: %s", exc)
        return None


def complete_json(
    system_prompt: str,
    user_prompt: str,
    *,
    temperature: float = 0.6,
    max_tokens: int = 4000,
) -> dict | None:
    """Request a JSON-object completion. Returns None on any failure."""
    client = _get_client()
    if client is None:
        logger.info("OpenAI not configured; skipping AI completion.")
        return None
    try:
        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            temperature=temperature,
            max_tokens=max_tokens,
        )
        content = response.choices[0].message.content
        if not content:
            return None
        parsed = json.loads(content)
        return parsed if isinstance(parsed, dict) else None
    except json.JSONDecodeError as exc:
        logger.warning("OpenAI returned malformed JSON: %s", exc)
        return None
    except Exception as exc:
        logger.warning("OpenAI completion failed: %s", exc)
        return None
