"""Itinerary editing services (Phase 13 studio backend).

Every mutation re-runs schedule repair and re-scores the trip so the map,
budget, and Optimization Score always reflect the current plan.
"""
import logging

from apps.ai.prompts import ITINERARY_SYSTEM
from apps.ai.schemas import parse_itinerary_draft
from apps.itineraries.engine import repair_schedule
from apps.itineraries.optimizer import optimize_trip
from apps.itineraries.regenerate import build_demo_day
from apps.trips.documents import Activity, ItineraryDay, Trip

logger = logging.getLogger(__name__)


class ItineraryError(Exception):
    def __init__(self, message: str, code: str = "ITINERARY_ERROR"):
        super().__init__(message)
        self.message = message
        self.code = code


def _activity_from_draft(draft) -> Activity:
    return Activity(
        name=draft.name,
        description=draft.description,
        start_time=draft.start_time,
        duration_minutes=draft.duration_minutes,
        location_name=draft.location_name or draft.name[:250],
        latitude=draft.latitude,
        longitude=draft.longitude,
        category=draft.category,
        cost_estimate=float(draft.cost_estimate),
    )


def _get_day(trip: Trip, day_number: int):
    """Find a day, auto-creating missing day slots up to duration_days.

    Trips created manually (not via the AI planner) have an empty itinerary;
    the studio needs the day structure to exist before editing. Day numbers
    beyond duration_days are rejected.
    """
    if day_number < 1 or day_number > (trip.duration_days or 1):
        raise ItineraryError(f"Day {day_number} does not exist.", code="DAY_NOT_FOUND")

    days = list(trip.itinerary.days or [])
    by_number = {day.day_number: day for day in days}
    if day_number in by_number:
        return by_number[day_number]

    existing_numbers = {day.day_number for day in days}
    start = trip.start_date
    for slot in range(1, trip.duration_days + 1):
        if slot not in existing_numbers:
            day = ItineraryDay(day_number=slot, title=f"Day {slot}")
            if start is not None:
                from datetime import timedelta

                day.date = start + timedelta(days=slot - 1)
            days.append(day)
            by_number[slot] = day
    trip.itinerary.days = days
    return by_number[day_number]


def _finalize(trip: Trip) -> None:
    optimize_trip(trip, {"interests": trip.interests})
    trip.save()


def replace_day_activities(trip: Trip, day_number: int, activities: list[Activity]) -> Trip:
    """Replace a day's activities with the provided list (user order kept)."""
    day = _get_day(trip, day_number)
    day.activities = activities
    repair_schedule(day.activities)
    _finalize(trip)
    logger.info("Replaced %d activities on day %d of trip %s", len(activities), day_number, trip.id)
    return trip


def append_activity(trip: Trip, day_number: int, activity: Activity) -> Trip:
    day = _get_day(trip, day_number)
    day.activities.append(activity)
    repair_schedule(day.activities)
    _finalize(trip)
    return trip


def remove_activity(trip: Trip, day_number: int, index: int) -> Trip:
    day = _get_day(trip, day_number)
    if index < 0 or index >= len(day.activities):
        raise ItineraryError("Activity position not found.", code="ACTIVITY_NOT_FOUND")
    removed = day.activities.pop(index)
    repair_schedule(day.activities)
    _finalize(trip)
    logger.info("Removed activity %r from day %d of trip %s", removed.name, day_number, trip.id)
    return trip


def regenerate_day(trip: Trip, day_number: int, mood: str) -> tuple[Trip, bool]:
    """Regenerate one day with the given mood. Returns (trip, used_ai)."""
    from apps.ai.orchestrator import PlannerOrchestrator

    orchestrator = PlannerOrchestrator()
    draft_day = None

    if orchestrator.ai_enabled:
        raw = orchestrator._ai_complete(  # noqa: SLF001 - internal reuse by design
            ITINERARY_SYSTEM,
            (
                f"Trip requirements: destination {trip.destination}, travellers "
                f"{trip.travelers}, interests {trip.interests}, desired mood '{mood}'.\n"
                f"Produce an itinerary with EXACTLY ONE day (day_number {day_number})."
            ),
            temperature=0.6,
        )
        parsed = parse_itinerary_draft(raw)
        if parsed is not None and parsed.days:
            draft_day = parsed.days[0]

    used_ai = draft_day is not None
    if draft_day is None:
        draft_day = build_demo_day(trip.destination, day_number, mood)

    day = _get_day(trip, day_number)
    day.title = draft_day.title or f"Day {day_number}"
    day.activities = [_activity_from_draft(a) for a in draft_day.activities]
    repair_schedule(day.activities)
    score = optimize_trip(trip, {"interests": trip.interests})
    trip.save()
    logger.info(
        "Regenerated day %d of trip %s (mood=%s ai=%s score=%s)",
        day_number, trip.id, mood, used_ai, score["score"],
    )
    return trip, used_ai
