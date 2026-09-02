"""AI planning orchestrator with Live Travel Intelligence and Groq LLM.

Pipeline per user message:
    1. Check for natural language trip modifications ("Smart Actions")
    2. Extract travel requirements & intent using Groq LLM
    3. If user is asking questions (weather, costing, sights, packing, recommendations),
       fetch real-time external data (OpenMeteo weather, Nominatim places) and provide
       a rich, dynamic AI conversational answer.
    4. If critical itinerary criteria (destination + duration) are present and user is planning,
       generate a high-precision structured itinerary, persist as a Trip document, and return.
    5. If details are missing for planning, dynamically converse with the user via Groq
       without static/canned text loops.
"""
import logging

from apps.ai import prompts
from apps.ai.demo import build_demo_itinerary
from apps.ai.schemas import ItineraryDraft, parse_itinerary_draft, parse_requirement_patch
from apps.travel import services as travel_services
from apps.trips.geocode import KNOWN_CITY_COORDS
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


def merge_requirements(current: dict | None, patch) -> dict:
    """Merge a validated RequirementPatch into the conversation state."""
    state = dict(current or {})
    for field in REQUIREMENT_FIELDS:
        value = getattr(patch, field, None)
        if value is None:
            continue
        if isinstance(value, list):
            state[field] = list(dict.fromkeys([*state.get(field, []), *value]))[:30]
        elif hasattr(value, "isoformat"):
            state[field] = value.isoformat()
        else:
            state[field] = value
    return state


def get_destination_context(destination: str) -> str:
    """Fetch live weather and real location details to feed into the Groq prompt."""
    if not destination or not destination.strip():
        return ""

    dest = destination.strip()
    context_parts = []

    # 1. Resolve coordinates
    lat, lon = None, None
    dest_lower = dest.lower()
    for city_key, coords in KNOWN_CITY_COORDS.items():
        if city_key in dest_lower or dest_lower in city_key:
            lat, lon = coords
            break

    if lat is None or lon is None:
        try:
            place_res = travel_services.search_places(dest, limit=1)
            candidate = ((place_res or {}).get("results") or [None])[0]
            if candidate and "lat" in candidate and "lon" in candidate:
                lat, lon = float(candidate["lat"]), float(candidate["lon"])
        except Exception:
            lat, lon = None, None

    # 2. Fetch live weather if coordinates are found
    if lat is not None and lon is not None:
        try:
            weather_data = travel_services.get_weather(lat, lon, days=3)
            if weather_data and "current" in weather_data:
                curr = weather_data["current"]
                temp = curr.get("temperature_c", "N/A")
                feels = curr.get("feels_like_c", temp)
                cond = curr.get("condition", "Pleasant")
                icon = curr.get("icon", "☀️")
                humidity = curr.get("humidity_percent", 50)
                wind = curr.get("wind_speed_kmh", 10)
                context_parts.append(
                    f"- Live Weather for {dest.title()}: {icon} {cond}, {temp}°C (feels like {feels}°C), "
                    f"Humidity: {humidity}%, Wind: {wind} km/h."
                )
                if "forecast" in weather_data:
                    forecast_summaries = []
                    for f in weather_data["forecast"][:3]:
                        forecast_summaries.append(
                            f"{f.get('date', '')}: {f.get('condition', '')} ({f.get('min_temp_c')}°C - {f.get('max_temp_c')}°C)"
                        )
                    if forecast_summaries:
                        context_parts.append(f"- 3-Day Forecast: {'; '.join(forecast_summaries)}")
        except Exception as exc:
            logger.debug("Failed to fetch live weather for context: %s", exc)

    return "\n".join(context_parts)


def is_explicit_itinerary_request(content: str) -> bool:
    """Detect if the user is asking to build/generate a full day-by-day itinerary."""
    lowered = content.lower()
    keywords = [
        "plan a trip", "create itinerary", "build itinerary", "make a plan",
        "generate trip", "plan my trip", "give me an itinerary", "day by day",
        "schedule a trip", "plan 3 days", "plan 4 days", "plan 5 days",
        "plan 7 days", "plan a week", "let's go to", "organize a trip"
    ]
    return any(kw in lowered for kw in keywords)


def is_general_question(content: str) -> bool:
    """Detect if the user is asking general questions like weather, cost, advice, food, packing."""
    lowered = content.lower()
    keywords = [
        "weather", "temperature", "forecast", "cost", "how much", "budget", "price",
        "estimate", "hotel", "flight", "places to visit", "what to see", "food",
        "best time", "packing", "pack", "recommend", "should i go", "what is", "how is",
        "tips", "is it expensive", "pkr", "usd"
    ]
    return any(kw in lowered for kw in keywords)


class PlannerOrchestrator:
    def __init__(self, ai_complete_json=None, ai_complete_text=None):
        self._ai_complete_json = ai_complete_json or openai_client.complete_json
        self._ai_complete_text = ai_complete_text or openai_client.complete_text

    @property
    def ai_enabled(self) -> bool:
        return openai_client.is_enabled()

    def extract_requirements(self, current_state: dict, recent: list[str], message: str):
        if not self.ai_enabled:
            from apps.ai.local_extract import extract_local
            return extract_local(message)

        raw = self._ai_complete_json(
            prompts.REQUIREMENTS_SYSTEM,
            prompts.build_requirements_prompt(current_state, recent, message),
            temperature=0.1,
            max_tokens=2000,
        )
        if raw is not None:
            return parse_requirement_patch(raw)

        from apps.ai.local_extract import extract_local
        return extract_local(message)

    def answer_conversational(
        self, current_state: dict, recent: list[str], message: str, context_data: str = ""
    ) -> str:
        """Provide a direct, intelligent, dynamic response using Groq LLM."""
        if self.ai_enabled:
            reply = self._ai_complete_text(
                prompts.CONVERSATIONAL_SYSTEM,
                prompts.build_conversational_prompt(
                    current_state, recent, message, context_data=context_data
                ),
                temperature=0.7,
            )
            if reply and reply.strip():
                return reply.strip()

        # Fallback if AI provider is completely offline
        destination = current_state.get("destination", "your destination")
        return (
            f"I'm ready to help you explore **{destination}**! "
            "Tell me how many days you'd like to travel, your budget, or any specific activities you enjoy, "
            "and I will craft a customized itinerary for you."
        )

    def generate_itinerary(self, requirements: dict):
        """Return (draft, engine) — engine is 'openai' (Groq) or 'demo'."""
        wanted_days = int(requirements.get("duration_days") or 0)
        # Long trips need more output tokens
        max_tokens = max(6000, wanted_days * 400) if wanted_days else 6000

        draft = None
        if self.ai_enabled:
            # First attempt: clearly specify exact day count in the prompt
            raw = self._ai_complete_json(
                prompts.ITINERARY_SYSTEM,
                prompts.build_itinerary_prompt(requirements, force_exact_days=False),
                temperature=0.5,
                max_tokens=max_tokens,
            )
            draft = parse_itinerary_draft(raw)

            # Validate day count: if wrong, retry with VERY explicit instruction
            if draft is not None and wanted_days and len(draft.days) != wanted_days:
                logger.info(
                    "Itinerary produced %d days but %d requested — retrying with explicit count enforcement.",
                    len(draft.days),
                    wanted_days,
                )
                raw = self._ai_complete_json(
                    prompts.ITINERARY_SYSTEM,
                    prompts.build_itinerary_prompt(requirements, force_exact_days=True),
                    temperature=0.2,
                    max_tokens=max_tokens,
                )
                draft = parse_itinerary_draft(raw)

            # If still wrong or None, do a final structural retry with schema emphasis
            if draft is None:
                logger.info("Itinerary validation failed; retrying with schema emphasis.")
                raw = self._ai_complete_json(
                    prompts.ITINERARY_SYSTEM,
                    prompts.build_itinerary_prompt(requirements, force_exact_days=True)
                    + "\n\nFollow the JSON schema EXACTLY. Ensure days and activities arrays are fully populated.",
                    temperature=0.2,
                    max_tokens=max_tokens,
                )
                draft = parse_itinerary_draft(raw)

        if draft is None or not draft.days:
            fitted = build_demo_itinerary(requirements)
            return self._fit_demo_days(fitted, requirements), "demo"

        # Patch: if AI still gave wrong count, fill remaining days from last generated day
        if wanted_days and len(draft.days) != wanted_days:
            draft = self._fix_day_count(draft, wanted_days)

        return draft, "openai"

    @staticmethod
    def _fix_day_count(draft: ItineraryDraft, wanted: int) -> ItineraryDraft:
        """Ensure draft has exactly `wanted` days — trim excess or replicate last day."""
        days = list(draft.days[:wanted])
        while len(days) < wanted and days:
            # Copy the last day pattern but increment day_number
            template = days[-1]
            days.append(template.model_copy(update={"day_number": len(days) + 1}))
        return ItineraryDraft(destination=draft.destination, days=days)

    @staticmethod
    def _fit_demo_days(draft: ItineraryDraft, requirements: dict) -> ItineraryDraft:
        wanted = int(requirements.get("duration_days") or len(draft.days))
        days = list(draft.days[:wanted])
        while len(days) < wanted and days:
            template = days[(len(days)) % len(days)]
            days.append(template.model_copy(update={"day_number": len(days) + 1}))
        return ItineraryDraft(destination=draft.destination, days=days)


def process_user_message(conversation, content: str, recent_messages: list[str]) -> dict:
    """Full pipeline. Returns {"reply", "meta", "trip"} for the view."""
    from apps.trips.documents import Trip
    from apps.trips.services import create_trip_from_itinerary

    orchestrator = PlannerOrchestrator()

    # --- Smart Actions: modify an already-saved trip via natural language ----
    if conversation.last_trip_id:
        from apps.ai.modify import apply_command, detect_command

        command = detect_command(content)
        if command:
            trip = Trip.objects(id=conversation.last_trip_id).first()
            if trip is not None and trip.owner_public_id == conversation.owner_public_id:
                try:
                    notes, summary = apply_command(trip, command)
                except Exception:
                    logger.exception("Smart action failed")
                    return {
                        "reply": "I couldn't apply that change right now — please try again.",
                        "meta": {"type": "error"},
                        "trip": None,
                    }
                from apps.notifications.service import notify

                notify(
                    conversation.owner_public_id,
                    "trip_saved",
                    "Itinerary updated ✨",
                    "Your trip was adjusted based on your request.",
                    link=f"/trips/{trip.id}",
                )
                detail = " " + " ".join(notes) if notes else ""
                return {
                    "reply": (
                        f"Done — I updated the trip to {summary}.{detail}\n\n"
                        f"You can open it here: /trips/{trip.id}"
                    ),
                    "meta": {"type": "itinerary_modified", "trip_id": str(trip.id), "command": command},
                    "trip": trip,
                }

    # Step 1: Extract requirements from message
    try:
        patch = orchestrator.extract_requirements(
            conversation.requirements, recent_messages, content
        )
    except Exception:
        logger.exception("Requirement extraction failed unexpectedly.")
        patch = None

    if patch is not None:
        conversation.requirements = merge_requirements(conversation.requirements, patch)
        conversation.save()

    dest = conversation.requirements.get("destination") or ""
    context_data = get_destination_context(dest)

    # Step 2: Determine user intent
    # If the user asks a general question (weather, advice, food, packing, etc.) without specifying days/planning,
    # use dynamic conversational LLM. If they ask to plan or supply destination + duration, create the trip!
    user_asks_question = is_general_question(content) and not is_explicit_itinerary_request(content)
    has_critical_fields = bool(conversation.requirements.get("destination") and conversation.requirements.get("duration_days"))
    wants_itinerary = is_explicit_itinerary_request(content) or (has_critical_fields and not user_asks_question)

    if not wants_itinerary or not has_critical_fields:
        # Dynamic AI Conversational Reply with Live Context
        reply = orchestrator.answer_conversational(
            conversation.requirements,
            recent_messages,
            content,
            context_data=context_data,
        )
        return {
            "reply": reply,
            "meta": {
                "type": "conversation",
                "captured": [
                    f for f in ("destination", "duration_days", "travelers", "budget_amount")
                    if conversation.requirements.get(f)
                ],
            },
            "trip": None,
        }

    # Step 3: Generate Itinerary if critical criteria are met
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
    requirements["destination"] = draft.destination or dest
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

    score_note = ""
    if trip.optimization_score is not None:
        score_note = f" Trip Optimization Score: {trip.optimization_score}/100."
        if trip.insights:
            score_note += f" {trip.insights[0]}"

    weather_highlight = ""
    if context_data and "Live Weather" in context_data:
        weather_highlight = f"\n\n**Weather Update:**\n{context_data.splitlines()[0]}"

    reply = (
        f"Your **{trip.duration_days}-day trip to {trip.destination}** is ready!"
        f"{interest_note}{budget_note}{score_note}{weather_highlight}\n\n"
        f"I've saved it as \u201c**{trip.title}**\u201d — click below to view the day-by-day itinerary, interactive map, and budget breakdown. Let me know if you would like to adjust any activities!"
    )

    result_payload = {
        "reply": reply,
        "meta": {
            "type": "itinerary_generated",
            "engine": engine,
            "trip_id": str(trip.id),
            "requirements": {k: v for k, v in requirements.items() if v},
        },
        "trip": trip,
    }

    from apps.notifications.service import notify_itinerary_generated
    notify_itinerary_generated(
        conversation.owner_public_id, str(trip.id), trip.title
    )
    return result_payload


