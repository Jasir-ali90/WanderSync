"""Calculated budget breakdown for a trip (derived figures, clearly estimated)."""

BUDGET_CATEGORY_MAP = {
    "hotel": "accommodation",
    "transport": "transportation",
    "food": "food",
    "attraction": "activities",
    "museum": "activities",
    "tour": "activities",
    "nature": "activities",
    "beach": "activities",
    "shopping": "miscellaneous",
    "nightlife": "miscellaneous",
    "rest": "miscellaneous",
}


def build_budget_breakdown(trip, requirements: dict | None = None) -> dict:
    """Compute per-category estimated totals for a trip's itinerary."""
    categories = {key: 0.0 for key in (
        "accommodation", "transportation", "activities", "food", "miscellaneous"
    )}
    for day in trip.itinerary.days:
        for activity in day.activities:
            category = BUDGET_CATEGORY_MAP.get(activity.category, "miscellaneous")
            categories[category] += float(activity.cost_estimate or 0)

    for key in categories:
        categories[key] = round(categories[key], 2)

    total = trip.itinerary.total_estimated_cost()
    days_count = max(1, trip.duration_days or 1)
    budget_amount = trip.budget_amount or (requirements or {}).get("budget_amount")
    remaining = None
    if budget_amount:
        remaining = round(float(budget_amount) - total, 2)

    return {
        "categories": categories,
        "total_estimate": total,
        "currency": trip.budget_currency or "USD",
        "daily_average": round(total / days_count, 2),
        "declared_budget": float(budget_amount) if budget_amount else None,
        "budget_remaining": remaining,
        "is_estimate": True,
    }