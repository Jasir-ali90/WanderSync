"""OpenAI-compatible AI integration — the only place that talks to an LLM.

Works with ANY OpenAI-compatible endpoint (OpenAI, Groq, OpenRouter,
Together, DeepSeek, local Ollama/vLLM servers, ...) by configuring:

    OPENAI_API_KEY   -> provider key
    OPENAI_MODEL     -> model name for that provider
    OPENAI_BASE_URL  -> e.g. https://api.groq.com/openai/v1  (optional)

Contract: ``complete_json`` returns a parsed dict, or ``None`` on any failure
(missing key, network error, timeout, malformed JSON). It NEVER raises into
calling services; callers decide how to degrade.
"""
import json
import logging

from django.conf import settings

logger = logging.getLogger(__name__)

REQUEST_TIMEOUT_SECONDS = 45


def is_enabled() -> bool:
    return bool(settings.OPENAI_API_KEY)


def _get_client():
    if not is_enabled():
        return None
    try:
        from openai import OpenAI

        kwargs = {
            "api_key": settings.OPENAI_API_KEY,
            "timeout": REQUEST_TIMEOUT_SECONDS,
            "default_headers": {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) WanderSync/1.0"},
        }
        # Any OpenAI-compatible provider can be plugged in via base_url.
        base_url = getattr(settings, "OPENAI_BASE_URL", "")
        if base_url:
            kwargs["base_url"] = base_url
        return OpenAI(**kwargs)
    except Exception as exc:  # pragma: no cover - SDK import issues
        logger.warning("AI client unavailable: %s", exc)
        return None


def _models_to_try() -> list[str]:
    primary = settings.OPENAI_MODEL
    fallbacks = list(getattr(settings, "OPENAI_FALLBACK_MODELS", []))
    return [primary] + [m for m in fallbacks if m and m != primary]


def complete_json(
    system_prompt: str,
    user_prompt: str,
    *,
    temperature: float = 0.6,
    max_tokens: int = 4000,
) -> dict | None:
    """Request a JSON-object completion. Returns None on any failure.

    Tries the primary model first; if the provider rejects it (e.g. the model
    was retired), transparently retries the fallback models so the chatbot
    keeps working without a redeploy.
    """
    max_tokens = max(max_tokens, 1024)
    client = _get_client()
    if client is None:
        logger.info("AI not configured; skipping AI completion.")
        return None

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]
    last_error: Exception | None = None
    for model in _models_to_try():
        try:
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                response_format={"type": "json_object"},
                temperature=temperature,
                max_tokens=max_tokens,
            )
            content = response.choices[0].message.content
            if not content:
                continue
            parsed = json.loads(content)
            if isinstance(parsed, dict):
                return parsed
        except json.JSONDecodeError as exc:
            logger.warning("AI (%s) returned malformed JSON: %s", model, exc)
            return None
        except Exception as exc:  # noqa: BLE001 - degrade gracefully
            last_error = exc
            message = str(exc)
            if "insufficient_quota" in message or "credit_balance" in message or "429" in message:
                logger.warning(
                    "AI quota exhausted (%s). Falling back to DEMO mode — "
                    "add credits or switch OPENAI_BASE_URL/OPENAI_MODEL to another provider.",
                    model,
                )
                return None
            logger.warning("AI completion failed on %s: %s", model, exc)
    if last_error is not None:
        logger.warning("All AI models failed; last error: %s", last_error)
    return None

