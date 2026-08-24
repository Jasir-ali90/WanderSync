"""Unit tests for the geometry/schedule engine (pure, no DB)."""
from types import SimpleNamespace as NS

from django.test import SimpleTestCase

from apps.itineraries.engine import (
    find_overlaps,
    format_hhmm,
    haversine_km,
    order_by_proximity,
    parse_hhmm,
    repair_schedule,
    travel_minutes_between,
)


def act(name="A", start="09:00", duration=60, lat=None, lng=None):
    return NS(
        name=name,
        start_time=start,
        duration_minutes=duration,
        latitude=lat,
        longitude=lng,
    )


class HaversineTests(SimpleTestCase):
    def test_known_distance_paris_london(self):
        km = haversine_km(48.8566, 2.3522, 51.5074, -0.1278)
        self.assertAlmostEqual(km, 343.5, delta=6)

    def test_zero_distance_same_point(self):
        self.assertEqual(haversine_km(10.0, 20.0, 10.0, 20.0), 0.0)

    def test_symmetry(self):
        ab = haversine_km(41.9028, 12.4964, 43.7696, 11.2558)  # Rome-Florence
        ba = haversine_km(43.7696, 11.2558, 41.9028, 12.4964)
        self.assertAlmostEqual(ab, ba)


class TimeHelpersTests(SimpleTestCase):
    def test_parse_hhmm(self):
        self.assertEqual(parse_hhmm("09:30"), 570)
        self.assertIsNone(parse_hhmm("9"))
        self.assertIsNone(parse_hhmm("25:00"))
        self.assertIsNone(parse_hhmm(None))

    def test_format_roundtrip(self):
        self.assertEqual(format_hhmm(570), "09:30")
        self.assertEqual(format_hhmm(0), "00:00")


class TravelTimeTests(SimpleTestCase):
    def test_travel_time_scales_with_distance(self):
        near_a, near_b = act(lat=48.85, lng=2.35), act(lat=48.86, lng=2.36)
        far_c = act(lat=45.75, lng=4.85)  # Lyon
        near = travel_minutes_between(near_a, near_b)
        far = travel_minutes_between(near_a, far_c)
        self.assertLess(near, far)
        self.assertGreaterEqual(far, 60)

    def test_missing_coords_return_none(self):
        self.assertIsNone(travel_minutes_between(act(), act(lat=1, lng=1)))


class ProximityOrderingTests(SimpleTestCase):
    def test_ordering_reduces_total_distance(self):
        # Deliberately zig-zag across a city grid.
        zigzag = [
            act(name="east", lat=48.85, lng=2.40),
            act(name="far-west", lat=48.84, lng=2.25),
            act(name="mid-west", lat=48.85, lng=2.30),
            act(name="center", lat=48.86, lng=2.35),
            act(name="west", lat=48.84, lng=2.27),
        ]
        before = sum(
            haversine_km(a.latitude, a.longitude, b.latitude, b.longitude)
            for a, b in zip(zigzag, zigzag[1:])
        )
        ordered = order_by_proximity(zigzag)
        after = sum(
            haversine_km(a.latitude, a.longitude, b.latitude, b.longitude)
            for a, b in zip(ordered, ordered[1:])
        )
        self.assertLess(after, before)

    def test_original_list_untouched(self):
        items = [act(name="b", lat=1, lng=1), act(name="a", lat=2, lng=2), act()]
        snapshot = [i.name for i in items]
        order_by_proximity(items)
        self.assertEqual([i.name for i in items], snapshot)

    def test_no_coord_activities_kept_at_end_in_order(self):
        items = [
            act(name="geo-1", lat=1, lng=1),
            act(name="free-A"),
            act(name="geo-2", lat=1.01, lng=1.01),
            act(name="free-B"),
        ]
        ordered = order_by_proximity(items)
        names = [a.name for a in ordered]
        self.assertEqual(names[-2:], ["free-A", "free-B"])

    def test_short_lists_returned_unchanged(self):
        items = [act(), act()]
        self.assertEqual(order_by_proximity(items), items)


class ScheduleRepairTests(SimpleTestCase):
    def test_overlap_is_detected(self):
        activities = [act(start="09:00", duration=120), act(start="10:00", duration=60)]
        self.assertEqual(find_overlaps(activities), [(0, 1)])

    def test_repair_shifts_overlapping_activity(self):
        activities = [
            act(name="first", start="09:00", duration=120),
            act(name="second", start="09:30", duration=60),
        ]
        _, issues = repair_schedule(activities)
        second_start = parse_hhmm(activities[1].start_time)
        first_end = parse_hhmm(activities[0].start_time) + 120
        self.assertGreaterEqual(second_start, first_end)
        self.assertTrue(any("second" in i for i in issues))

    def test_repair_respects_day_window(self):
        activities = [act(name="late", start="21:00", duration=180)]
        _, issues = repair_schedule(activities)
        self.assertTrue(any("ends after" in i for i in issues))
        self.assertEqual(activities[0].start_time, "21:00")

    def test_valid_schedule_has_no_issues_and_stable_times(self):
        activities = [
            act(start="09:00", duration=90),
            act(start="11:00", duration=90),
            act(start="14:00", duration=60),
        ]
        original_starts = [a.start_time for a in activities]
        repaired, issues = repair_schedule(activities)
        self.assertEqual(issues, [])
        self.assertEqual([a.start_time for a in repaired], original_starts)

    def test_activities_without_start_time_get_day_default(self):
        activities = [act(start=None)]
        repair_schedule(activities)
        self.assertEqual(activities[0].start_time, "08:00")
