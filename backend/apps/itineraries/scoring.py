"""Transparent Trip Optimization Score.

Factors (weighted): geographic efficiency, schedule balance, budget fit,
preference match. Every score ships with its breakdown and human-readable
insights — no black-box numbers.
"""
from apps.itineraries.engine import (
    DAY_END_MINUTES,
    total_route_distance_km,
)

WEIGHTS = {
    "geographic_efficiency": 0.30,
    "schedule_balance": 0.25,
    "budget_fit": 0.25,
    "preference_match": 0.20,
}

NEUTRAL_SCORE = 70  # used when a factor cannot be evaluated

# interest keywords -> activity categories they map to
_INTEREST_CATEGORIES = {
    "museum": {"museum"},
    "museums": {"museum"},
    "history": {"museum", "attraction"},
    "historical": {"attraction", "museum"},
    "food": {"food"},
    "cuisine": {"food"},
    "gastronomy": {"food"},
    "nature": {"nature", "beach"},
    "beach": {"beach"},
    "shopping": {"shopping"},
    "nightlife": {"nightlife"},
    "hiking": {"nature"},
}


def _clamp(value: float, low: int = 0, high: int = 100) -> int:
    return int(max(low, min(high, round(value))))


def _preferred_categories(requirements: dict) -> set[str]:
    preferred: set[str] = set()
    for interest in requirements.get("interests") or []:
        key = str(interest).strip().lower()
        for keyword, categories in _INTEREST_CATEGORIES.items():
            if keyword in key:
                preferred |= categories
    style = str(requirements.get("travel_style") or "").lower()
    if style == "foodie":
        preferred.add("food")
    if style in ("cultural", "romantic"):
        preferred |= {"museum", "attraction"}
    if style == "adventure":
        preferred |= {"nature"}
    return preferred


def _geographic_efficiency(days) -> tuple[int, list[str]]:
    distances: list[float] = []
    insights: list[str] = []
    for index, day in enumerate(days, start=1):
        km = total_route_distance_km(day.activities)
        geo_count = sum(
            1 for a in day.activities if getattr(a, "latitude", None) is not None
        )
        if geo_count >= 2:
            distances.append(km)
            if km <= 8:
                insights.append(
                    f"Day {index} is tightly clustered — only {km:.1f} km of travel between stops."
                )
            elif km > 40:
                insights.append(
                    f"Day {index} spreads over {km:.1f} km; expect longer transfers."
                )
    if not distances:
        return NEUTRAL_SCORE, ["Add locations to activities to unlock route analysis."]
    average = sum(distances) / len(distances)
    # 4 km/day average ≈ perfect, 45+ km/day ≈ worst.
    score = 100 - (average - 4) * (100 / 41)
    return _clamp(score), insights


def _schedule_balance(days) -> tuple[int, list[str]]:
    insights: list[str] = []
    scores: list[float] = []
    for day in days:
        count = len(day.activities)
        scheduled_minutes = 0
        for activity in day.activities:
            parts = str(getattr(activity, "start_time", "")).split(":")
            if len(parts) == 2 and parts[0].isdigit() and parts[1].isdigit():
                begin = int(parts[0]) * 60 + int(parts[1])
                end = min(
                    begin + max(0, getattr(activity, "duration_minutes", 0)),
                    DAY_END_MINUTES,
                )
                scheduled_minutes += max(0, end - begin)
        hours = scheduled_minutes / 60

        if count == 0:
            scores.append(40)
            continue
        # Ideal: 3-6 activities, 5-10 scheduled hours.
        count_penalty = 0 if count <= 6 else (count - 6) * 12
        if count < 3:
            count_penalty = (3 - count) * 10
        hours_penalty = 0 if 5 <= hours <= 10 else min(30, abs(hours - 7.5) * 5)
        scores.append(max(20, 100 - count_penalty - hours_penalty))

        if count > 6:
            insights.append(
                f"A day packs {count} activities — that's a marathon, not a holiday."
            )
        elif hours > 11:
            insights.append(
                f"Roughly {hours:.0f}h of back-to-back plans in one day leaves "
                "little breathing room."
            )

    if not scores:
        return NEUTRAL_SCORE, insights
    return _clamp(sum(scores) / len(scores)), insights


def _budget_fit(total_cost: float | None, requirements: dict) -> tuple[int, list[str]]:
    budget = requirements.get("budget_amount")
    if not budget or total_cost is None:
        return NEUTRAL_SCORE, []
    ratio = total_cost / float(budget)
    currency = requirements.get("budget_currency", "USD")
    if ratio <= 0.9:
        score = 100
        insight = (
            f"Estimated cost ({total_cost:,.0f}) fits comfortably inside your "
            f"{float(budget):,.0f} {currency} budget."
        )
    else:
        overrun = (ratio - 0.9) * 100
        score = max(10, 100 - overrun * 2)
        insight = (
            f"Estimated cost ({total_cost:,.0f}) runs past your "
            f"{float(budget):,.0f} {currency} budget — I can look for cheaper "
            "alternatives."
        )
    return _clamp(score), [insight]


def _preference_match(days, requirements: dict) -> tuple[int, list[str]]:
    preferred = _preferred_categories(requirements)
    all_activities = [a for day in days for a in day.activities]
    if not preferred or not all_activities:
        return NEUTRAL_SCORE, []

    matched = sum(
        1 for a in all_activities if getattr(a, "category", "") in preferred
    )
    share = matched / len(all_activities)
    score = 35 + share * 65

    insights: list[str] = []
    top_categories = {
        getattr(a, "category", "")
        for a in all_activities
        if getattr(a, "category", "") in preferred
    }
    if top_categories and share >= 0.4:
        listing = ", ".join(sorted(c for c in top_categories if c))
        insights.append(
            f"{int(share * 100)}% of planned activities match your interests ({listing})."
        )
    elif share < 0.25:
        insights.append(
            "Few activities match your stated interests — tell me more about what you love."
        )
    return _clamp(score), insights


def score_trip_days(days, requirements: dict, total_cost: float | None = None) -> dict:
    """Compute the Trip Optimization Score with full breakdown + insights."""
    geo_score, geo_insights = _geographic_efficiency(days)
    sched_score, sched_insights = _schedule_balance(days)
    budget_score, budget_insights = _budget_fit(total_cost, requirements)
    pref_score, pref_insights = _preference_match(days, requirements)

    breakdown = {
        "geographic_efficiency": geo_score,
        "schedule_balance": sched_score,
        "budget_fit": budget_score,
        "preference_match": pref_score,
    }
    overall = _clamp(sum(breakdown[f] * WEIGHTS[f] for f in WEIGHTS))

    insights = [*geo_insights, *sched_insights, *budget_insights, *pref_insights]
    if overall >= 80:
        insights.insert(0, "This itinerary is well balanced — great pacing and routing.")
    return {
        "score": overall,
        "breakdown": breakdown,
        "insights": insights[:6],
    }


