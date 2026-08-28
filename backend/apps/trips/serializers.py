"""Trip request/response validation."""
from django.utils import timezone
from rest_framework import serializers

from apps.accounts.documents import User  # noqa: F401 (type reference)
from apps.trips.documents import (
    BUDGET_LEVELS,
    MAX_TRIP_DAYS,
    TRAVEL_STYLES,
    TRIP_STATUSES,
    VISIBILITIES,
)


class TripWriteSerializer(serializers.Serializer):
    """Create/update payload for trips (partial-friendly)."""

    title = serializers.CharField(max_length=200, required=False)
    destination = serializers.CharField(max_length=200, required=False)
    start_date = serializers.DateField(required=False, allow_null=True, default=None)
    end_date = serializers.DateField(required=False, allow_null=True, default=None)
    travelers = serializers.IntegerField(min_value=1, max_value=50, required=False)
    budget_amount = serializers.DecimalField(
        max_digits=12, decimal_places=2, min_value=0,
        required=False, allow_null=True, default=None,
    )
    budget_currency = serializers.CharField(min_length=3, max_length=3, required=False)
    budget_level = serializers.ChoiceField(choices=BUDGET_LEVELS, required=False)
    travel_style = serializers.ChoiceField(choices=TRAVEL_STYLES, required=False)
    interests = serializers.ListField(
        child=serializers.CharField(max_length=64), required=False, max_length=30
    )
    status = serializers.ChoiceField(choices=TRIP_STATUSES, required=False)
    visibility = serializers.ChoiceField(choices=VISIBILITIES, required=False)
    notes = serializers.CharField(
        max_length=5000, required=False, allow_blank=True, style={"base_template": "textarea.html"}
    )

    def validate_title(self, value: str) -> str:
        return value.strip()

    def validate_destination(self, value: str) -> str:
        return value.strip()

    def validate_budget_currency(self, value: str) -> str:
        return value.upper()

    def validate(self, attrs):
        start = attrs.get("start_date")
        end = attrs.get("end_date")
        if start and end and end < start:
            raise serializers.ValidationError(
                {"end_date": "End date cannot be before the start date."},
                code="date_order",
            )
        if end and end < timezone.now().date() - timezone.timedelta(days=365 * 2):
            raise serializers.ValidationError(
                {"end_date": "End date is too far in the past."},
                code="stale_trip",
            )
        return attrs

    def _apply_dates(self, trip):
        trip.recompute_duration()
        if trip.duration_days > MAX_TRIP_DAYS:
            raise serializers.ValidationError(
                {"end_date": f"Trips are limited to {MAX_TRIP_DAYS} days."},
                code="too_long",
            )

    def create(self, validated_data):
        from apps.trips.documents import Trip

        trip = Trip(**validated_data)
        self._apply_dates(trip)
        return trip

    def update(self, instance, validated_data):
        from decimal import Decimal

        # A currency change must actually convert stored amounts (budget,
        # itinerary activities, expenses) between the old and new currency —
        # never simply swap the label on the same number.
        new_currency = validated_data.get("budget_currency")
        old_currency = getattr(instance, "budget_currency", "PKR") or "PKR"
        currency_changed = bool(new_currency and new_currency != old_currency)

        for field, value in validated_data.items():
            # MongoEngine FloatField rejects Decimal objects (DRF's
            # DecimalField output) - coerce to plain float first.
            if isinstance(value, Decimal):
                value = float(value)
            setattr(instance, field, value)

        if currency_changed:
            from apps.trips.exchange import convert

            # If a new budget figure was supplied it is already denominated
            # in the target currency - otherwise convert the stored value so
            # the amount actually changes instead of just relabeling it.
            if "budget_amount" not in validated_data and instance.budget_amount:
                instance.budget_amount = round(
                    convert(instance.budget_amount, old_currency, new_currency), 2
                )

            for day in instance.itinerary.days:
                for activity in day.activities:
                    activity.cost_estimate = round(
                        convert(activity.cost_estimate or 0, old_currency, new_currency), 2
                    )

            for expense in instance.expenses:
                expense.amount = round(
                    convert(expense.amount or 0, old_currency, new_currency), 2
                )

        self._apply_dates(instance)
        instance.save()
        return instance

