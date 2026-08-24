"""Integration: optimizer runs inside create_trip_from_itinerary."""
from datetime import date

from django.test import SimpleTestCase

from apps.ai.schemas import ActivityDraft, DayDraft, ItineraryDraft
from apps.trips.documents import Trip
from apps.trips.services import create_trip_from_itinerary

REQUIREMENTS = {
    "destination": "Paris",
    "duration_days": 1,
    "travelers": 2,
    "budget_amount": 500,
    "budget_currency": "EUR",
    "interests": ["museums"],
    "start_date": "2027-05-01",
}


def zigzag_draft() -> ItineraryDraft:
    """Deliberately non-optimal ordering across Paris."""
    stops = [
        ("Louvre", 48.8606, 2.3376, "museum", 20),
        ("Versailles-ish far west", 48.8049, 2.1204, "attraction", 30),
        ("Eiffel Tower", 48.8584, 2.2945, "attraction", 25),
        ("Notre-Dame", 48.8530, 2.3499, "attraction", 10),
        ("Montmartre", 48.8867, 2.3431, "attraction", 15),
    ]
    activities = [
        ActivityDraft(
            name=name,
            start_time="08:00",
            duration_minutes=90,
            latitude=lat,
            longitude=lng,
            category=category,
            cost_estimate=cost,
        )
        for name, lat, lng, category, cost in stops
    ]
    return ItineraryDraft(
        destination="Paris", days=[DayDraft(day_number=1, title="Paris", activities=activities)]
    )


class OptimizerIntegrationTests(SimpleTestCase):
    def setUp(self):
        Trip.drop_collection()

    def tearDown(self):
        Trip.drop_collection()

    def test_created_trip_is_optimized_and_scored(self):
        trip = create_trip_from_itinerary(
            owner_public_id="a" * 32,
            requirements=REQUIREMENTS,
            draft=zigzag_draft(),
            engine="demo",
        )
        # Score computed and persisted.
        self.assertIsNotNone(trip.optimization_score)
        self.assertTrue(0 <= trip.optimization_score <= 100)
        self.assertEqual(len(trip.score_breakdown), 4)

        # Total route distance must be lower than the original zig-zag draft.
        from apps.itineraries.engine import haversine_km, total_route_distance_km

        original_stops = trip.itinerary.days[0].activities
        # Recreate the original (pre-optimisation) order from the known inputs.
        original_coords = [
            (48.8606, 2.3376), (48.8049, 2.1204), (48.8584, 2.2945),
            (48.8530, 2.3499), (48.8867, 2.3431),
        ]
        before = sum(
            haversine_km(a[0], a[1], b[0], b[1])
            for a, b in zip(original_coords, original_coords[1:])
        )
        after = total_route_distance_km(original_stops)
        self.assertLess(after, before)

        # Schedule repaired: starts at day default and no overlaps.
        times = [
            int(a.start_time[:2]) * 60 + int(a.start_time[3:])
            for a in trip.itinerary.days[0].activities
        ]
        self.assertGreaterEqual(times[0], 8 * 60)
        for earlier, later in zip(times, times[1:]):
            self.assertLessEqual(earlier, later)

        # API dict exposes optimization block.
        api = trip.to_api_dict()
        self.assertEqual(api["optimization"]["score"], trip.optimization_score)
        self.assertIn("breakdown", api["optimization"])

