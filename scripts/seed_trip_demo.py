"""Seed one demo trip (with un-geocoded activities) for the geocode probe."""
import os
import sys
from datetime import date, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + "/backend")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")

import django  # noqa: E402

django.setup()

from apps.accounts.documents import User  # noqa: E402
from apps.trips.documents import Activity, Itinerary, ItineraryDay, Trip  # noqa: E402

user = User.objects(email="demo@wandersync.test").first()
if not user:
    print("demo user missing — run manage.py seed_demo first")
    sys.exit(1)

if Trip.objects(owner_public_id=user.public_id, title__iexact="Istanbul City Break").first():
    print("demo trip already exists")
    sys.exit(0)

start = date.today() + timedelta(days=3)
activities = [
    ("Hagia Sophia", "09:00", "attraction", 25),
    ("Grand Bazaar", "12:30", "shopping", 15),
    ("Bosphorus Cruise", "16:00", "nature", 40),
]
day_one = ItineraryDay(
    day_number=1,
    date=start,
    title="Old City highlights",
    activities=[
        Activity(name=name, start_time=time, location_name=f"{name}, Istanbul", category=cat, cost_estimate=cost)
        for name, time, cat, cost in activities
    ],
)

trip = Trip(
    owner_public_id=user.public_id,
    title="Istanbul City Break",
    destination="Istanbul",
    start_date=start,
    end_date=start + timedelta(days=2),
    duration_days=3,
    travelers=2,
    budget_amount=900,
    budget_currency="USD",
    status="planned",
    interests=["history", "food"],
    itinerary=Itinerary(days=[day_one]),
).save()

print(f"created trip {trip.id} with {len(day_one.activities)} activities without coordinates")