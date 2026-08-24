"""Geometry & schedule engine for itineraries."""
import math

# Assumed average speed for intra-city travel (traffic, walking legs, parking).
AVG_CITY_SPEED_KMH = 22.0
DEFAULT_BUFFER_MINUTES = 15
MIN_TRAVEL_MINUTES = 5
MAX_TRAVEL_MINUTES = 120

DAY_START_MINUTES = 8 * 60   # 08:00
DAY_END_MINUTES = 22 * 60    # 22:00

EARTH_RADIUS_KM = 6371.0088


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Great-circle distance in kilometres between two points."""
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lng2 - lng1)
    a = (
        math.sin(dphi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(dlmb / 2) ** 2
    )
    return 2 * EARTH_RADIUS_KM * math.asin(math.sqrt(a))


def parse_hhmm(value) -> int | None:
    """'HH:MM' -> minutes since midnight; None when absent/malformed."""
    if not value or not isinstance(value, str):
        return None
    parts = value.strip().split(":")
    if len(parts) != 2:
        return None
    try:
        hours, minutes = int(parts[0]), int(parts[1])
    except ValueError:
        return None
    if not (0 <= hours <= 23 and 0 <= minutes <= 59):
        return None
    return hours * 60 + minutes


def format_hhmm(minutes: int) -> str:
    minutes = max(0, min(minutes, 24 * 60 - 1))
    return f"{minutes // 60:02d}:{minutes % 60:02d}"


def has_coords(activity) -> bool:
    return getattr(activity, "latitude", None) is not None and getattr(
        activity, "longitude", None
    ) is not None


def travel_minutes_between(a, b) -> int | None:
    """Estimated travel minutes between two activities (None w/o coords)."""
    if not (has_coords(a) and has_coords(b)):
        return None
    km = haversine_km(a.latitude, a.longitude, b.latitude, b.longitude)
    minutes = (km / AVG_CITY_SPEED_KMH) * 60 + DEFAULT_BUFFER_MINUTES
    return int(max(MIN_TRAVEL_MINUTES, min(MAX_TRAVEL_MINUTES, round(minutes))))


def total_route_distance_km(activities) -> float:
    """Sum of consecutive leg distances over geo-tagged activities."""
    geo = [a for a in activities if has_coords(a)]
    total = 0.0
    for first, second in zip(geo, geo[1:]):
        total += haversine_km(
            first.latitude, first.longitude, second.latitude, second.longitude
        )
    return round(total, 3)


def order_by_proximity(activities):
    """Greedy nearest-neighbour ordering of a day's activities.

    Geo-tagged activities are chained from the first one; activities without
    coordinates keep their relative order at the end of the day.
    Returns a NEW list; input is untouched.
    """
    items = list(activities)
    if len(items) <= 2:
        return items
    geo = [a for a in items if has_coords(a)]
    rest = [a for a in items if not has_coords(a)]
    if len(geo) < 2:
        return items

    route = [geo.pop(0)]
    while geo:
        last = route[-1]
        nearest = min(
            geo,
            key=lambda a: haversine_km(
                last.latitude, last.longitude, a.latitude, a.longitude
            ),
        )
        route.append(nearest)
        geo.remove(nearest)
    return route + rest


def find_overlaps(activities) -> list[tuple[int, int]]:
    """Indices (i, j), i<j of activity pairs whose time ranges collide.

    Uses start_time + duration_minutes; pairs lacking a parseable start_time
    are skipped.
    """
    windows = []
    for index, activity in enumerate(activities):
        start = parse_hhmm(getattr(activity, "start_time", ""))
        if start is None:
            continue
        end = start + max(0, getattr(activity, "duration_minutes", 0))
        windows.append((index, start, end))

    overlaps = []
    for pos, (i, si, ei) in enumerate(windows):
        for j, sj, ej in windows[pos + 1:]:
            if sj < ei and si < ej:
                overlaps.append((i, j))
    return overlaps


def repair_schedule(activities):
    """Shift activities so the day fits 08:00-22:00 without collisions.

    Walks activities in their given order; when an activity would start before
    the previous one ends (plus travel buffer) it is pushed later; anything
    that no longer fits before day end is flagged. Mutates ``start_time`` on
    each activity and returns ``(activities, issues)`` where issues are
    human-readable strings.
    """
    issues: list[str] = []
    previous_end: int | None = None
    previous = None

    for position, activity in enumerate(activities, start=1):
        name = getattr(activity, "name", f"activity {position}")
        desired = parse_hhmm(getattr(activity, "start_time", "")) or DAY_START_MINUTES
        desired = max(desired, DAY_START_MINUTES)
        duration = max(15, getattr(activity, "duration_minutes", 60))

        if previous_end is not None:
            travel = travel_minutes_between(previous, activity) or DEFAULT_BUFFER_MINUTES
            earliest = previous_end + travel
        else:
            travel = 0
            earliest = DAY_START_MINUTES

        start = max(desired, earliest)
        if start > desired:
            issues.append(
                f"Moved “{name}” from {format_hhmm(desired)} to "
                f"{format_hhmm(start)} to avoid overlap/travel conflict."
            )
        if start + duration > DAY_END_MINUTES:
            issues.append(
                f"“{name}” ends after {format_hhmm(DAY_END_MINUTES)} — consider "
                "removing it or shortening the day."
            )

        activity.start_time = format_hhmm(start)
        previous_end = start + duration
        previous = activity

    return list(activities), issues
