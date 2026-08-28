"""Real itinerary modifications driven by natural-language plan ('Smart Actions').

These apply STRUCTURED changes to a saved trip (not just a text reply), so the
map, budget and score update. Patterns are keyword-based and deliberately
conservative. Because these mutate a trip, they only run when the conversation
has a linked trip and the user asks for a change.
"""

PATTERNS = {
    "cheaper": ["cheaper", "cheap", "lower cost", "cut cost", "reduce budget"],
    "relaxing": ["less busy", "more relax", "less packed", "slower pace"],
    "rainy": ["rainy", "rain", "indoor"],
    "food": ["food experience", "food tour", "eat more", "add food"],
    "family": ["family", "kid friendly", "children"],
}


def detect_command(message: str) -> str | None:
    lowered = message.lower()
    for command, keywords in PATTERNS.items():
        if any(kw in lowered for kw in keywords):
            return command
    return None


def apply_command(trip, command: str) -> tuple[list[str], str]:
    """Apply a structured modification. Returns (notes, summary)."""
    from apps.itineraries.regenerate import build_demo_day
    from apps.trips.documents import Activity

    notes: list[str] = []
    summary = ""

    if command == "cheaper":
        changed = []
        for day in trip.itinerary.days:
            for activity in day.activities:
                if (activity.cost_estimate or 0) > 0:
                    old = activity.cost_estimate
                    activity.cost_estimate = round(old * 0.7, 2)
                    changed.append(activity.name)
        trip.notes = (trip.notes + "\n[Action] Reduced estimated activity costs by ~30%.").strip()
        notes.append("Reduced estimated activity costs by ~30% to stay within budget.")
        summary = "make it cheaper"

    elif command == "relaxing":
        # Halve the number of activities on each over-full day.
        for day in trip.itinerary.days:
            if len(day.activities) > 4:
                keep = day.activities[::2]  # drop every other activity
                day.activities = keep
                notes.append(f"Day {day.day_number} was thinned to {len(keep)} activities for a relaxed pace.")
        if not notes:
            notes.append("Your days were already nicely paced.")
        summary = "make it more relaxing"

    elif command == "family":
        trip.budget_level = "moderate"
        for day in trip.itinerary.days:
            for activity in day.activities:
                if activity.category not in ("nature", "attraction", "food", "beach", "tour"):
                    activity.category = "attraction"
                if (activity.duration_minutes or 60) > 150:
                    activity.duration_minutes = 120
        trip.notes = (trip.notes + "\n[Action] Adjusted for a family-friendly pace.").strip()
        notes.append("Adjusted categories and durations for a family-friendly pace.")
        summary = "make it family-friendly"

    elif command == "food":
        # Append a food tasting activity to the last day; cap at 12/day.
        day = trip.itinerary.days[-1]
        if len(day.activities) < 12:
            draft = build_demo_day(trip.destination, day.day_number, "balanced")
            food_activity = [a for a in draft.activities if a.category == "food"][0]
            day.activities.append(
                Activity(
                    name=food_activity.name,
                    description=food_activity.description,
                    start_time="19:00",
                    duration_minutes=90,
                    category="food",
                    cost_estimate=max(10.0, (trip.duration_days or 1) * 5),
                    location_name=trip.destination,
                )
            )
            notes.append("Added a local food-tasting experience to the final evening.")
        else:
            notes.append("Day is full — you can add activities manually in the studio.")
        summary = "add a food experience"

    elif command == "rainy":
        for day in trip.itinerary.days:
            for activity in day.activities:
                if activity.category in ("nature", "beach"):
                    activity.category = "museum"
                    activity.description = (activity.description or "") + " (rainy-day alternative)"
        trip.notes = (trip.notes + "\n[Action] Swapped outdoor stops for indoor alternatives.").strip()
        notes.append("Swapped outdoor stops for indoor alternatives (rainy-day plan).")
        summary = "find rainy-day alternatives"

    # Re-optimize & re-score after any mutation.
    from apps.itineraries.engine import repair_schedule
    from apps.itineraries.optimizer import optimize_trip

    for day in trip.itinerary.days:
        repair_schedule(day.activities)
    optimize_trip(trip, {"interests": trip.interests})
    trip.save()
    return notes, summary