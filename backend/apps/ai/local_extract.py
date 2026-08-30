"""Local (non-AI) requirement extraction for DEMO mode.

When no OpenAI key is configured, this keeps the planner usable end-to-end:
simple regex heuristics pull out the most common requirement phrasings. Every
value it produces flows through the same Pydantic validation as AI output.
"""
import re

from apps.ai.schemas import RequirementPatch, parse_requirement_patch

_DESTINATION_PATTERNS = [
    r"\b(?:trip|journey|vacation|holiday)\s+(?:to|in)\s+([A-Za-z][A-Za-z '’\-]{1,60})",
    r"\bvisit(?:s|ed|ing)?\s+([A-Za-z][A-Za-z '’\-]{1,60})",
    r"\b(?:go|going|travel)\s+(?:to|in)\s+([A-Za-z][A-Za-z '’\-]{1,60})",
]

# Short replies like "tokyo" or "paris in december" are common answers to the
# bot's destination question — recognise them so the chat never loops.
_GREETINGS = {
    "hi", "hello", "hey", "yo", "ok", "okay", "yes", "no", "nah", "sure",
    "thanks", "thank", "help", "plan", "trip", "please", "done", "cool",
    "nice", "great", "bye", "start", "go",
}

_DURATION_PATTERN = re.compile(r"(\d{1,3})\s*-?\s*days?\b", re.IGNORECASE)
_BUDGET_PATTERN = re.compile(r"\$\s?([\d,]+(?:\.\d{1,2})?)|\bbudget\b[^\d]{0,12}([\d,]+)", re.IGNORECASE)
_TRAVELERS_PATTERN = re.compile(r"(\d{1,2})\s+(?:people|persons|adults|guests|of us)\b", re.IGNORECASE)

_INTEREST_KEYWORDS = {
    "museum": "museums",
    "history": "historical sites",
    "historical": "historical sites",
    "food": "food",
    "cuisine": "food",
    "beach": "beaches",
    "nature": "nature",
    "hiking": "hiking",
    "shopping": "shopping",
    "nightlife": "nightlife",
    "adventure": "adventure",
}


def _clean_destination(candidate: str | None) -> str | None:
    if not candidate:
        return None
    value = candidate.strip().rstrip(".!?,").strip()
    # Trim trailing filler words often caught by the regex.
    for filler in (" with ", " and ", " for ", " in ", " on "):
        index = value.lower().find(filler)
        if index > 0:
            value = value[:index]
    return value.strip()[:200] or None


def extract_local(message: str):
    """Best-effort extraction. Returns a validated patch or None."""
    if not message:
        return None

    destination = None
    lowered = message.lower()
    for pattern in _DESTINATION_PATTERNS:
        match = re.search(pattern, message, re.IGNORECASE)
        if match:
            destination = _clean_destination(match.group(1))
            if destination:
                break

    if destination is None:
        # Bare answer to the destination question: one to three words that
        # aren't small talk ("tokyo", "paris in december", "new zealand").
        words = [w for w in re.findall(r"[A-Za-z'’\-]+", message)]
        if 1 <= len(words) <= 3 and words[0].lower() not in _GREETINGS:
            candidate = _clean_destination(message)
            if candidate and re.fullmatch(r"[A-Za-z][A-Za-z '’\-]{1,60}", candidate):
                destination = candidate

    duration_days = None
    duration_match = _DURATION_PATTERN.search(lowered)
    if duration_match:
        duration_days = int(duration_match.group(1))

    budget_amount = None
    budget_match = _BUDGET_PATTERN.search(message)
    if budget_match:
        digits = (budget_match.group(1) or budget_match.group(2) or "").replace(",", "")
        try:
            budget_amount = float(digits)
        except ValueError:
            budget_amount = None

    travelers = None
    travelers_match = _TRAVELERS_PATTERN.search(lowered)
    if travelers_match:
        travelers = int(travelers_match.group(1))

    interests: list[str] = []
    seen: set[str] = set()
    for keyword, interest in _INTEREST_KEYWORDS.items():
        if keyword in lowered and interest not in seen:
            interests.append(interest)
            seen.add(interest)

    payload = {
        "destination": destination,
        "duration_days": duration_days,
        "budget_amount": budget_amount,
        "travelers": travelers,
        "interests": interests,
    }
    payload = {k: v for k, v in payload.items() if v}
    return parse_requirement_patch(payload)
