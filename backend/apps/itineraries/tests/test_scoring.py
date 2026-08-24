"""Unit + integration tests for the Trip Optimization Score."""
from types import SimpleNamespace as NS

from django.test import SimpleTestCase

from apps.itineraries.scoring import score_trip_days


def day(day_number, activities):
    return NS(day_number=day_number, activities=activities)


def act(name="A", category="attraction", start="09:00", duration=90, cost=20,
        lat=None, lng=None):
    return NS(
        name=name, category=category, start_time=start, duration_minutes=duration,
        cost_estimate=cost, latitude=lat, longitude=lng,
    )


GOOD_REQS = {
    "interests": ["museums", "food"],
    "travel_style": "cultural",
    "budget_amount": 1000,
    "budget_currency": "USD",
}


def good_trip_days():
    """Well-paced days, clustered coords, matching interests, low cost."""
    d1 = day(1, [
        act("Museum A", "museum", "09:00", 90, 20, lat=48.8566, lng=2.3522),
        act("Cafe Lunch", "food", "12:00", 60, 15, lat=48.8590, lng=2.3540),
        act("Museum B", "museum", "14:30", 90, 22, lat=48.8600, lng=2.3530),
        act("Old Town Walk", "attraction", "17:00", 90, 0, lat=48.8580, lng=2.3500),
    ])
    d2 = day(2, [
        act("Food Market", "food", "09:30", 90, 18, lat=48.8500, lng=2.3400),
        act("History Museum", "museum", "13:00", 120, 20, lat=48.8520, lng=2.3420),
        act("Riverside Stroll", "nature", "16:00", 60, 0, lat=48.8510, lng=2.3390),
    ])
    return [d1, d2]


class ScoringTests(SimpleTestCase):
    def test_good_trip_scores_high_with_full_breakdown(self):
        result = score_trip_days(good_trip_days(), GOOD_REQS, total_cost=185)
        self.assertGreaterEqual(result["score"], 80)
        self.assertEqual(
            set(result["breakdown"]),
            {"geographic_efficiency", "schedule_balance", "budget_fit", "preference_match"},
        )
        self.assertTrue(all(isinstance(i, str) and i for i in result["insights"]))

    def test_bad_trip_scores_lower_than_good_trip(self):
        bad = [
            day(1, [
                act(f"Stop {i}", category="shopping" if i % 2 else "nightlife",
                    start="08:00", duration=180, cost=400)
                for i in range(9)
            ]),
        ]
        good = score_trip_days(good_trip_days(), GOOD_REQS, total_cost=185)
        bad_result = score_trip_days(bad, GOOD_REQS, total_cost=5000)
        self.assertLess(bad_result["score"], good["score"])

    def test_budget_overrun_produces_actionable_insight(self):
        expensive = [day(1, [act(cost=900), act(cost=800), act()])]
        result = score_trip_days(expensive, GOOD_REQS, total_cost=1700)
        self.assertLess(result["breakdown"]["budget_fit"], 50)
        self.assertTrue(any("cheaper" in i or "runs past" in i for i in result["insights"]))

    def test_preference_match_rewards_matching_categories(self):
        matching = [day(1, [act(category="museum"), act(category="food"), act()])]
        mismatched = [
            day(1, [act(category="beach"), act(category="nightlife"), act()])
        ]
        match_score = score_trip_days(matching, GOOD_REQS)["breakdown"]["preference_match"]
        miss_score = score_trip_days(mismatched, GOOD_REQS)["breakdown"]["preference_match"]
        self.assertGreater(match_score, miss_score)

    def test_neutral_scores_when_no_signals(self):
        empty_reqs = {}
        result = score_trip_days([day(1, [act(), act(), act()])], empty_reqs)
        self.assertEqual(result["breakdown"]["budget_fit"], 70)  # NEUTRAL_SCORE
        self.assertTrue(0 <= result["score"] <= 100)

    def test_overpacked_day_flags_insight(self):
        packed = [day(1, [act(start="08:00", duration=120) for _ in range(8)])]
        result = score_trip_days(packed, GOOD_REQS)
        self.assertTrue(any("marathon" in i for i in result["insights"]))
