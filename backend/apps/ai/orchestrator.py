"""AI planning orchestrator.

Pipeline per user message:
    extract requirements -> merge into conversation state
    -> ask ONLY for missing critical fields
    -> generate itinerary (OpenAI structured output, validated; one retry;
       DEMO fallback) -> persist as a Trip -> assistant reply.

The module never raises on AI failures: every path returns a user-safe reply.
"""
import logging

from apps.ai import prompts
from apps.ai.demo import build_demo_itinerary
from apps.ai.schemas import ItineraryDraft, parse_itinerary_draft, parse_requirement_patch
from integrations.openai import client as openai_client

logger = logging.getLogger(__name__)

CRITICAL_FIELDS = ("destination", "duration_days")

REQUIREMENT_FIELDS = (
    "destination",
    "duration_days",
    "start_date",
    "travelers",
    "budget_amount",
    "budget_currency",
    "budget_level",
    "travel_style",
    "interests",
)

FOLLOW_UPS = {
    "destination": (
        "I'd love to help you plan! Which destination (city or country) are you "
        "dreaming of?"
    ),
    "duration_days": (
        "Great choice! How many days would you like to spend there? You can also "
        "tell me your travel dates if they're fixed."
    ),
}


def merge_requirements(current: dict | None, patch) -> dict:
    """Merge a validated RequirementPatch into the conversation state.

    Lists are unioned (order-preserving); scalars are overwritten only when
    the new value exists. Dates are stored as ISO strings so the value stays
    BSON-serializable inside a plain DictField.
    """
    state = dict(current or {})
    for field in REQUIREMENT_FIELDS:
        value = getattr(patch, field, None)
        if value is None:
            continue
        if isinstance(value, list):
            state[field] = list(dict.fromkeys([*state.get(field, []), *value]))[:30]
        elif hasattr(value, "isoformat"):  # date -> ISO string for BSON
            state[field] = value.isoformat()
        else:
            state[field] = value
    return state



def missing_critical_fields(requirements: dict) -> list[str]:
    return [f for f in CRITICAL_FIELDS if not requirements.get(f)]


class PlannerOrchestrator:
    def __init__(self, ai_complete=None):
        self._ai_complete = ai_complete or openai_client.complete_json

    @property
    def ai_enabled(self) -> bool:
        return openai_client.is_enabled()

    # -- stage 1: extraction -------------------------------------------------
    def extract_requirements(self, current_state: dict, recent: list[str], message: str):
        # DEMO mode (no key): local heuristics keep the planner usable.
        if not self.ai_enabled:
            from apps.ai.local_extract import extract_local

            return extract_local(message)
        raw = self._ai_complete(
            prompts.REQUIREMENTS_SYSTEM,
            prompts.build_requirements_prompt(current_state, recent, message),
            temperature=0.2,
            max_tokens=500,
        )
        return parse_requirement_patch(raw)


    # -- stage 2: itinerary generation ---------------------------------------
    def generate_itinerary(self, requirements: dict):
        """Return ``(draft, engine)`` — engine is 'openai' or 'demo'."""
        draft = None
        if self.ai_enabled:
            raw = self._ai_complete(
                prompts.ITINERARY_SYSTEM,
                prompts.build_itinerary_prompt(requirements),
                temperature=0.6,
            )
            draft = parse_itinerary_draft(raw)
            if draft is None:
                logger.info("Itinerary validation failed once; retrying with feedback.")
                raw = self._ai_complete(
                    prompts.ITINERARY_SYSTEM,
                    prompts.build_itinerary_prompt(requirements)
                    + "\n\nYour previous reply did not match the required JSON schema. "
                    "Follow the schema EXACTLY this time.",
                    temperature=0.3,
                )
                draft = parse_itinerary_draft(raw)
        if draft is None or not draft.days:
            fitted = build_demo_itinerary(requirements)
            return self._fit_demo_days(fitted, requirements), "demo"
        return draft, "openai"

    @staticmethod
    def _fit_demo_days(draft: ItineraryDraft, requirements: dict) -> ItineraryDraft:
        wanted = int(requirements.get("duration_days") or len(draft.days))
        days = list(draft.days[:wanted])
        while len(days) < wanted and days:
            template = days[(len(days)) % len(days)]
            days.append(template.model_copy(update={"day_number": len(days) + 1}))
        return ItineraryDraft(destination=draft.destination, days=days)


def process_user_message(conversation, content: str, recent_messages: list[str]) -> dict:
    """Full pipeline. Returns ``{"reply", "meta", "trip"}`` for the view."""
    from apps.trips.services import create_trip_from_itinerary

    orchestrator = PlannerOrchestrator()

    try:
        patch = orchestrator.extract_requirements(
            conversation.requirements, recent_messages, content
        )
    except Exception:
        logger.exception("Requirement extraction failed unexpectedly.")
        return {
            "reply": (
                "I hit a snag understanding that. Could you rephrase, "
                "or try again in a moment?"
            ),
            "meta": {"type": "error"},
            "trip": None,
        }
    if patch is not None:

        conversation.requirements = merge_requirements(conversation.requirements, patch)
        conversation.save()

    missing = missing_critical_fields(conversation.requirements)
    if missing:
        return {
            "reply": FOLLOW_UPS[missing[0]],
            "meta": {
                "type": "clarification",
                "missing": missing,
                "captured": [
                    f
                    for f in ("destination", "duration_days", "travelers", "budget_amount")
                    if conversation.requirements.get(f)
                ],
            },
            "trip": None,
        }

    try:
        draft, engine = orchestrator.generate_itinerary(conversation.requirements)
    except Exception:
        logger.exception("Itinerary generation failed unexpectedly.")
        return {
            "reply": (
                "Something went wrong while generating your itinerary. "
                "Please try again in a moment."
            ),
            "meta": {"type": "error"},
            "trip": None,
        }

    requirements = dict(conversation.requirements)
    requirements["destination"] = draft.destination  # trust the validated draft
    trip = create_trip_from_itinerary(
        owner_public_id=conversation.owner_public_id,
        requirements=requirements,
        draft=draft,
        engine=engine,
    )
    conversation.modify(last_trip_id=str(trip.id))

    interest_note = ""
    interests = requirements.get("interests") or []
    if interests:
        interest_note = f" I wove in your interests: {', '.join(interests[:4])}."
    budget_note = ""
    if requirements.get("budget_amount"):
        budget_note = (
            " Estimated total cost is about "
            f"{trip.itinerary.total_estimated_cost():,.0f} {trip.budget_currency}, "
            "against your budget of "
            f"{requirements['budget_amount']:,.0f} {trip.budget_currency}."
        )

    engine_note = "" if engine == "openai" else " (demo data — no AI key configured)"
    score_note = ""
    if trip.optimization_score is not None:
        score_note = f" Trip Optimization Score: {trip.optimization_score}/100."
        if trip.insights:
            score_note += f" {trip.insights[0]}"
    reply = (
        f"Your {trip.duration_days}-day trip to {trip.destination} is ready!"
        f"{interest_note}{budget_note}{score_note}\n\n"
        f"I've saved it as \u201c{trip.title}\u201d — open it to see the day-by-day plan, "
        f"map and budget.{engine_note} Want me to adjust anything?"
    )

    return {
        "reply": reply,
        "meta": {
            "type": "itinerary_generated",
            "engine": engine,
            "trip_id": str(trip.id),
            "requirements": {k: v for k, v in requirements.items() if v},
        },
        "trip": trip,
    }


