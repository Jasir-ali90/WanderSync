"""Pydantic schemas validating every structured AI response.

AI output is NEVER trusted for application logic: it must pass these models.
``parse_*`` helpers implement "safe repair" — invalid items are dropped rather
than crashing the pipeline; only structurally hopeless payloads return None.
"""
import logging
from datetime import date

from pydantic import BaseModel, ConfigDict, Field, field_validator

logger = logging.getLogger(__name__)

BUDGET_LEVELS = {"budget", "moderate", "luxury"}
TRAVEL_STYLES = {
    "relaxed", "balanced", "packed",
    "luxury", "adventure", "cultural", "romantic", "family", "foodie",
}
ACTIVITY_CATEGORIES = {
    "attraction", "museum", "food", "nature", "shopping",
    "transport", "hotel", "nightlife", "beach", "tour", "rest",
}


class RequirementPatch(BaseModel):
    """Fields the AI extracted from a single user message (all optional)."""

    model_config = ConfigDict(extra="ignore")

    destination: str | None = Field(default=None, max_length=200)
    duration_days: int | None = Field(default=None, ge=1, le=365)
    start_date: date | None = None
    travelers: int | None = Field(default=None, ge=1, le=50)
    budget_amount: float | None = Field(default=None, ge=0, le=100_000_000)
    budget_currency: str | None = Field(default=None, min_length=3, max_length=3)
    budget_level: str | None = None
    travel_style: str | None = None
    interests: list[str] = Field(default_factory=list, max_length=30)

    @field_validator("destination", mode="before")
    @classmethod
    def _clean_destination(cls, value):
        if isinstance(value, str):
            value = value.strip()
            if len(value) > 200:
                value = value[:200]
        return value or None

    @field_validator("start_date", mode="before")
    @classmethod
    def _parse_date(cls, value):
        if isinstance(value, str):
            value = value.strip()
            try:
                return date.fromisoformat(value[:10])
            except ValueError:
                return None
        return value

    @field_validator("budget_currency", mode="before")
    @classmethod
    def _clean_currency(cls, value):
        if isinstance(value, str):
            return value.strip().upper() or None
        return value

    @field_validator("budget_level", mode="before")
    @classmethod
    def _clean_budget_level(cls, value):
        if isinstance(value, str) and value.strip().lower() in BUDGET_LEVELS:
            return value.strip().lower()
        return None

    @field_validator("travel_style", mode="before")
    @classmethod
    def _clean_travel_style(cls, value):
        if isinstance(value, str) and value.strip().lower() in TRAVEL_STYLES:
            return value.strip().lower()
        return None


class ActivityDraft(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=800)
    start_time: str = Field(default="", max_length=5)
    duration_minutes: int = Field(default=60, ge=15, le=600)
    location_name: str = Field(default="", max_length=250)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    category: str = Field(default="attraction", max_length=32)
    cost_estimate: float = Field(default=0, ge=0, le=100_000)

    @field_validator("name", mode="before")
    @classmethod
    def _require_name(cls, value):
        if not isinstance(value, str) or not value.strip():
            raise ValueError("activity name required")
        return value.strip()

    @field_validator("category", mode="before")
    @classmethod
    def _clean_category(cls, value):
        if isinstance(value, str) and value.strip().lower() in ACTIVITY_CATEGORIES:
            return value.strip().lower()
        return "attraction"


class DayDraft(BaseModel):
    day_number: int = Field(ge=1, le=365)
    title: str = Field(default="", max_length=200)
    activities: list[ActivityDraft] = Field(default_factory=list, max_length=12)


class ItineraryDraft(BaseModel):
    model_config = ConfigDict(extra="ignore")

    destination: str = Field(max_length=200)
    days: list[DayDraft] = Field(min_length=1, max_length=365)


def parse_requirement_patch(raw: dict | None) -> RequirementPatch | None:
    """Validate an extraction payload; None when unusable."""
    if not isinstance(raw, dict):
        return None
    # Some models nest under "requirements" — unwrap defensively.
    inner = raw.get("requirements") if isinstance(raw.get("requirements"), dict) else raw
    try:
        patch = RequirementPatch.model_validate(inner)
    except Exception as exc:
        logger.info("Requirement extraction failed validation: %s", exc)
        return None
    has_content = any(
        getattr(patch, field) is not None for field in patch.model_fields
    )
    return patch if has_content else None


def parse_itinerary_draft(raw: dict | None) -> ItineraryDraft | None:
    """Validate an itinerary payload with item-level safe repair."""
    if not isinstance(raw, dict):
        return None
    candidate = raw.get("itinerary") if isinstance(raw.get("itinerary"), dict) else raw
    try:
        return ItineraryDraft.model_validate(candidate)
    except Exception:
        pass
    # Repair pass: rebuild day-by-day, dropping invalid activities/days.
    days = candidate.get("days") if isinstance(candidate.get("days"), list) else []
    repaired_days: list[DayDraft] = []
    for day_raw in days:
        if not isinstance(day_raw, dict):
            continue
        activities = []
        for activity_raw in day_raw.get("activities") or []:
            if not isinstance(activity_raw, dict):
                continue
            try:
                activities.append(ActivityDraft.model_validate(activity_raw))
            except Exception:
                logger.debug("Dropped invalid activity: %r", activity_raw)
        if activities:
            repaired_days.append(
                DayDraft(
                    day_number=len(repaired_days) + 1,
                    title=str(day_raw.get("title") or "")[:200],
                    activities=activities,
                )
            )
    destination = str(candidate.get("destination") or "").strip()[:200]
    if not destination or not repaired_days:
        logger.info("Itinerary draft unusable even after repair.")
        return None
    return ItineraryDraft(destination=destination, days=repaired_days)


