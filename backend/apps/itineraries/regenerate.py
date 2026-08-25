"""Regenerate-Day engine: mood presets -> one schema-valid demo day.

With an OpenAI key configured the orchestrator can also rebuild a day via AI;
this module guarantees a deterministic fallback either way.
"""
from apps.ai.schemas import ActivityDraft, DayDraft

# mood -> (activity count, duration multiplier, cost multiplier, category pool)
MOOD_PRESETS = {
    "relaxed": (3, 1.3, 0.9, ("nature", "rest", "food")),
    "balanced": (4, 1.0, 1.0, ("attraction", "food", "museum", "rest")),
    "packed": (6, 0.75, 0.9, ("attraction", "museum", "shopping", "tour", "food", "nature")),
    "budget": (4, 1.0, 0.45, ("attraction", "nature", "tour", "food")),
    "premium": (4, 1.1, 2.4, ("museum", "food", "nature", "nightlife")),
    "family": (5, 0.9, 1.1, ("attraction", "nature", "food", "beach", "tour")),
}

MOODS = tuple(MOOD_PRESETS)

_DAY_ACTIVITY_NAMES = {
    "attraction": ["Old Town Highlights Walk", "Iconic Landmark Visit", "Panoramic Viewpoint"],
    "museum": ["City History Museum", "Art Gallery Morning"],
    "food": ["Local Food Tasting", "Traditional Dinner"],
    "nature": ["Riverside Park Stroll", "Botanical Gardens"],
    "shopping": ["Artisan Market Browsing"],
    "tour": ["Guided Neighbourhood Tour"],
    "rest": ["Café Break & People Watching", "Leisure Time"],
    "nightlife": ["Evening at a Local Venue"],
    "beach": ["Beachfront Morning"],
}


def build_demo_day(destination: str, day_number: int, mood: str = "balanced") -> DayDraft:
    """Build one schema-valid demo day for the given mood preset."""
    count, duration_mult, cost_mult, categories = MOOD_PRESETS.get(
        mood, MOOD_PRESETS["balanced"]
    )
    destination = destination.strip().title() or "Your Destination"

    activities: list[ActivityDraft] = []
    minute_of_day = 9 * 60
    for slot in range(count):
        category = categories[slot % len(categories)]
        names = _DAY_ACTIVITY_NAMES.get(category) or [f"{category.title()} Stop"]
        name = names[(day_number + slot) % len(names)]
        duration = int([90, 60, 120][slot % 3] * duration_mult)
        cost = round([15, 25, 10][(day_number + slot) % 3] * cost_mult, 2)
        activities.append(
            ActivityDraft(
                name=f"{name} — {destination}",
                description=(
                    f"A {mood}-style {category} experience in {destination}. "
                    "(Demo data — connect an AI key for tailored plans.)"
                ),
                start_time=f"{minute_of_day // 60:02d}:{minute_of_day % 60:02d}",
                duration_minutes=max(30, duration),
                location_name=destination,
                category=category,
                cost_estimate=cost,
            )
        )
        minute_of_day += max(30, duration) + 40

    return DayDraft(
        day_number=day_number,
        title=f"{mood.title()} day in {destination}",
        activities=activities,
    )
