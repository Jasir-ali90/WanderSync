"""One-off data command: normalise legacy trips to the PKR base currency.

Trips created before the exchange-engine update store per-person USD figures.
This command converts every non-PKR trip's activity costs, expenses and budget
into PKR (the platform's base display currency) so existing data shows
consistent, convertible amounts.
"""
from django.core.management.base import BaseCommand

from apps.trips.documents import Trip
from apps.trips.exchange import convert

TARGET_CURRENCY = "PKR"


class Command(BaseCommand):
    help = "Convert all legacy non-PKR trip amounts to the PKR base currency."

    def handle(self, *args, **options):
        trips = Trip.objects(budget_currency__ne=TARGET_CURRENCY)
        updated = 0
        for trip in trips:
            old = trip.budget_currency or "USD"
            for day in trip.itinerary.days:
                for activity in day.activities:
                    if activity.cost_estimate:
                        activity.cost_estimate = round(
                            convert(activity.cost_estimate, old, TARGET_CURRENCY), 2
                        )
            for expense in trip.expenses:
                if expense.amount:
                    expense.amount = round(
                        convert(expense.amount, old, TARGET_CURRENCY), 2
                    )
            if trip.budget_amount:
                trip.budget_amount = round(
                    convert(trip.budget_amount, old, TARGET_CURRENCY), 2
                )
            trip.budget_currency = TARGET_CURRENCY
            trip.save()
            updated += 1
        self.stdout.write(
            self.style.SUCCESS(f"Normalised {updated} trip(s) to {TARGET_CURRENCY}.")
        )