"""Deterministic DEMO itinerary generator.

Used when the OpenAI key is not configured or AI output fails validation.
Every trip produced this way is clearly labelled engine="demo" so demo data
is never presented as live AI output.
"""
from datetime import date, timedelta

from apps.ai.schemas import ActivityDraft, DayDraft, ItineraryDraft

# (name template, category, duration, cost, description)
_ACTIVITY_TEMPLATES = {
    "cultural": [
        ("Historic Old Town Walking Tour", "tour", 150, 25),
        ("National Museum Visit", "museum", 120, 15),
        ("Local Craft Market Browsing", "shopping", 90, 10),
    ],
    "food": [
        ("Street Food Tasting Walk", "food", 120, 30),
        ("Traditional Cooking Class", "tour", 180, 55),
        ("Dinner at a Local Favourite", "food", 90, 35),
    ],
    "nature": [
        ("Scenic Park Morning Walk", "nature", 90, 0),
        ("Botanical Gardens Visit", "attraction", 120, 12),
        ("Sunset Viewpoint Hike", "nature", 120, 0),
    ],
    "default": [
        ("City Highlights Tour", "tour", 150, 25),
        ("Free Time for Local Exploration", "rest", 120, 0),
        ("Evening at a Popular Local Square", "nightlife", 120, 20),
    ],
}
_DAY_SHAPES = [
    ("Arrival & First Impressions", ["default", "food", "default"]),
    ("Culture & Sights", ["cultural", "food", "nature"]),
    ("Hidden Gems & Local Life", ["nature", "cultural", "food"]),
]


def build_demo_itinerary(requirements: dict) -> ItineraryDraft:
    destination = str(requirements.get("destination") or "Your Destination")
    days_count = int(requirements.get("duration_days") or 3)
    days_count = max(1, min(days_count, 14))
    style = requirements.get("travel_style") or (
        "cultural" if "culture" in str(requirements.get("interests", "")).lower() else "default"
    )
    level_multiplier = {"budget": 0.7, "moderate": 1.0, "luxury": 2.2}.get(
        requirements.get("budget_level"), 1.0
    )

    start_date = requirements.get("start_date") or date.today() + timedelta(days=30)
    if isinstance(start_date, str):
        try:
            start_date = date.fromisoformat(start_date[:10])
        except ValueError:
            start_date = date.today() + timedelta(days=30)

    days: list[DayDraft] = []
    clock = 9 * 60
    for day_number in range(1, days_count + 1):
        day_title, kinds = _DAY_SHAPES[(day_number - 1) % len(_DAY_SHAPES)]
        activities: list[ActivityDraft] = []
        minute_of_day = clock
        for index, kind in enumerate(kinds):

            pool = _ACTIVITY_TEMPLATES[kind]
            name_tpl, category, duration, base_cost = pool[
                (day_number + index) % len(pool)
            ]
            start_minutes = minute_of_day
            minute_of_day += duration + 45
            activities.append(
                ActivityDraft(
                    name=f"{name_tpl} — {destination}",
                    description=(
                        f"A well-loved {category} experience in {destination}. "
                        "(Demo data — connect an AI key for tailored plans.)"
                    ),
                    start_time=f"{start_minutes // 60:02d}:{start_minutes % 60:02d}",
                    duration_minutes=duration,
                    location_name=destination,
                    category=category,
                    cost_estimate=round(base_cost * level_multiplier, 2),
                )
            )
        days.append(
            DayDraft(
                day_number=day_number,
                title=(
                    day_title if day_number == 1 else f"Day {day_number} in {destination}"
                ),
                activities=activities,
            )
        )


    return ItineraryDraft(destination=destination, days=days)
