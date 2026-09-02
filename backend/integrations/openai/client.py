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
        base_url = getattr(settings, "OPENAI_BASE_URL", "")
        if base_url:
            kwargs["base_url"] = base_url
        return OpenAI(**kwargs)
    except Exception as exc:
        logger.info("OpenAI SDK client initialization note: %s", exc)
        return None


def _call_groq_http(messages: list[dict], model: str, temperature: float, max_tokens: int, json_mode: bool = False) -> str | None:
    """Direct HTTP fallback using requests in case SDK native binaries (like pydantic-core) encounter environment issues."""
    import requests

    api_key = settings.OPENAI_API_KEY
    if not api_key:
        return None

    base_url = getattr(settings, "OPENAI_BASE_URL", "") or "https://api.groq.com/openai/v1"
    endpoint = f"{base_url.rstrip('/')}/chat/completions"

    payload: dict = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    if json_mode:
        payload["response_format"] = {"type": "json_object"}

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) WanderSync/1.0",
    }

    try:
        res = requests.post(endpoint, json=payload, headers=headers, timeout=REQUEST_TIMEOUT_SECONDS)
        if res.status_code == 200:
            data = res.json()
            choices = data.get("choices") or []
            if choices and "message" in choices[0]:
                return choices[0]["message"].get("content")
        else:
            logger.warning("Groq HTTP API call returned status %s: %s", res.status_code, res.text[:200])
    except Exception as exc:
        logger.warning("Groq HTTP fallback error: %s", exc)
    return None


def _models_to_try() -> list[str]:
    primary = settings.OPENAI_MODEL
    fallbacks = list(getattr(settings, "OPENAI_FALLBACK_MODELS", []))
    return [primary] + [m for m in fallbacks if m and m != primary]


def complete_text(
    system_prompt: str,
    user_prompt: str,
    *,
    temperature: float = 0.7,
    max_tokens: int = 4000,
) -> str | None:
    """Request a raw text completion (freeform conversation, weather synthesis, advice).

    Returns None on any failure. Transparently retries configured fallback models.
    """
    max_tokens = max(max_tokens, 512)
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]

    client = _get_client()
    last_error: Exception | None = None
    for model in _models_to_try():
        try:
            if client is not None:
                response = client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                )
                content = response.choices[0].message.content
                if content and content.strip():
                    return content.strip()
            else:
                content = _call_groq_http(messages, model, temperature, max_tokens, json_mode=False)
                if content and content.strip():
                    return content.strip()
        except Exception as exc:  # noqa: BLE001 - degrade gracefully
            last_error = exc
            message = str(exc)
            if "insufficient_quota" in message or "credit_balance" in message or "429" in message:
                logger.warning(
                    "AI quota exhausted (%s). Check Groq credits or switch model.",
                    model,
                )
                return None
            logger.warning("AI text completion failed on %s: %s, trying HTTP fallback", model, exc)
            content = _call_groq_http(messages, model, temperature, max_tokens, json_mode=False)
            if content and content.strip():
                return content.strip()

    if last_error is not None:
        logger.warning("All AI models failed in complete_text; last error: %s", last_error)
    return None


def complete_json(
    system_prompt: str,
    user_prompt: str,
    *,
    temperature: float = 0.4,
    max_tokens: int = 4000,
) -> dict | None:
    """Request a JSON-object completion. Returns None on any failure.

    Tries the primary model first; if the provider rejects it (e.g. the model
    was retired), transparently retries the fallback models so the chatbot
    keeps working without a redeploy.
    """
    max_tokens = max(max_tokens, 1024)
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]

    client = _get_client()
    last_error: Exception | None = None
    for model in _models_to_try():
        try:
            content = None
            if client is not None:
                response = client.chat.completions.create(
                    model=model,
                    messages=messages,
                    response_format={"type": "json_object"},
                    temperature=temperature,
                    max_tokens=max_tokens,
                )
                content = response.choices[0].message.content
            else:
                content = _call_groq_http(messages, model, temperature, max_tokens, json_mode=True)

            if not content:
                continue
            try:
                parsed = json.loads(content)
                if isinstance(parsed, dict):
                    return parsed
            except json.JSONDecodeError:
                # Try simple trailing repair if JSON was slightly truncated
                trimmed = content.rstrip()
                for suffix in ("]}", "]}", "}]}", "\"\"]}", "\"\"]}]}"):
                    try:
                        parsed = json.loads(trimmed + suffix)
                        if isinstance(parsed, dict):
                            return parsed
                    except Exception:
                        pass
                logger.warning("AI (%s) returned malformed JSON, trying next model", model)
                continue
        except Exception as exc:  # noqa: BLE001 - degrade gracefully
            last_error = exc
            message = str(exc)
            if "insufficient_quota" in message or "credit_balance" in message or "429" in message:
                logger.warning(
                    "AI quota exhausted (%s). Check Groq credits or switch model.",
                    model,
                )
                continue
            logger.warning("AI completion failed on %s: %s, trying HTTP fallback", model, exc)
            content = _call_groq_http(messages, model, temperature, max_tokens, json_mode=True)
            if content:
                try:
                    parsed = json.loads(content)
                    if isinstance(parsed, dict):
                        return parsed
                except json.JSONDecodeError:
                    pass

    if last_error is not None:
        logger.warning("All AI models failed; last error: %s", last_error)
    return None

