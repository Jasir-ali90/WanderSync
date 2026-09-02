"""Prompt construction for the AI planner.

All prompts are intentionally compact to stay within the Groq free-tier
8000 TPM limit. User messages are DATA, never instructions.
"""

CONVERSATIONAL_SYSTEM = """You are WanderSync AI travel concierge.
Provide accurate, helpful travel advice: weather, budgets, packing, food, sights.
Use real-time data provided in the prompt. Give clear markdown answers.
Never output static or repeated template text — always answer the specific question asked."""

REQUIREMENTS_SYSTEM = """Extract travel requirements from the user message.
Return ONLY valid JSON with these optional keys (omit missing):
{"destination":str, "duration_days":int, "start_date":"YYYY-MM-DD",
 "travelers":int, "budget_amount":number, "budget_currency":"ISO-3",
 "budget_level":"budget"|"moderate"|"luxury",
 "travel_style":"relaxed"|"balanced"|"packed"|"luxury"|"adventure"|"cultural"|"romantic"|"family"|"foodie",
 "interests":[str]}
Rules: Extract only what user said. "a week"->7, "weekend"->2. Output raw JSON only."""

ITINERARY_SYSTEM = """You are a real-world travel itinerary generator.
Return ONLY valid JSON:
{"destination":str, "days":[{"day_number":int, "title":str,
  "activities":[{"name":str, "description":str, "start_time":"HH:MM",
    "duration_minutes":int, "location_name":str,
    "category":"attraction"|"museum"|"food"|"nature"|"shopping"|"transport"|"hotel"|"nightlife"|"beach"|"tour"|"rest",
    "cost_estimate":number}]}]}
CRITICAL:
1. Generate EXACTLY the number of days in duration_days. If 20 days requested, output 20 day objects.
2. 3-5 activities per day in chronological order.
3. Cluster activities geographically per day.
4. Theme day groups for long trips (e.g. days 1-3 city, days 4-6 nature).
5. Output raw JSON only — no markdown, no extra text."""


def _requirements_summary(requirements: dict) -> str:
    known = {k: v for k, v in (requirements or {}).items() if v}
    s = str(known) if known else "(none)"
    return s[:400]  # Hard cap to prevent prompt bloat


def build_requirements_prompt(
    current_state: dict, recent_messages: list[str], message: str
) -> str:
    recent = "\n".join(f"- {m[:180]}" for m in recent_messages[-3:])
    return (
        f"Known: {_requirements_summary(current_state)}\n"
        f"Recent:\n{recent or '(none)'}\n\n"
        f"Message: \"{message[:1200]}\"\n\nExtract new/updated requirements."
    )


def build_conversational_prompt(
    current_state: dict,
    recent_messages: list[str],
    message: str,
    context_data: str = "",
) -> str:
    recent = "\n".join(f"- {m[:180]}" for m in recent_messages[-4:])
    ctx = f"\nLive data:\n{context_data[:800]}\n" if context_data else ""
    return (
        f"Trip info: {_requirements_summary(current_state)}\n"
        f"{ctx}"
        f"Recent:\n{recent or '(none)'}\n\n"
        f"User: \"{message[:1000]}\"\n\nAnswer now."
    )


def build_itinerary_prompt(requirements: dict, *, force_exact_days: bool = False) -> str:
    duration = requirements.get("duration_days")
    duration_note = (
        f"MUST generate EXACTLY {duration} days (1 to {duration}). "
        if duration else ""
    )
    strict = "Verify day count equals requested number before output. " if force_exact_days else ""
    return (
        f"Requirements: {_requirements_summary(requirements)}\n\n"
        f"{duration_note}{strict}"
        "Generate full itinerary as JSON now."
    )
