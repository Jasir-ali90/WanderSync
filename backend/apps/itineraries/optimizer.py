"""Optimizer facade: reorder, repair, then score a trip's itinerary."""
import logging

from apps.itineraries.engine import order_by_proximity, repair_schedule
from apps.itineraries.scoring import score_trip_days

logger = logging.getLogger(__name__)


def optimize_trip(trip, requirements: dict) -> dict:
    """Optimize ``trip.itinerary`` in place and store the score on the trip.

    Returns the score payload ``{"score", "breakdown", "insights"}``.
    """
    for day in trip.itinerary.days:
        day.activities = order_by_proximity(list(day.activities))
        _, issues = repair_schedule(day.activities)
        if issues:
            logger.debug("Schedule repair issues on day %s: %s", day.day_number, issues)

    total_cost = sum(
        (a.cost_estimate or 0) for d in trip.itinerary.days for a in d.activities
    )
    score = score_trip_days(trip.itinerary.days, requirements, total_cost=total_cost)
    trip.optimization_score = score["score"]
    trip.score_breakdown = score["breakdown"]
    trip.insights = score["insights"]
    return score
