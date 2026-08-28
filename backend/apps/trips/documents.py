"""Trip and itinerary documents.

A Trip owns an embedded Itinerary. The Itinerary Engine (later phase) fills
the day/activity structures; the schema is defined here so persistence, APIs
and editing all share one shape.
"""
from bson import ObjectId
from django.utils import timezone
from mongoengine import (
    BooleanField,
    DateField,
    DateTimeField,
    DictField,
    Document,
    EmbeddedDocument,
    EmbeddedDocumentField,
    FloatField,
    IntField,
    ListField,
    StringField,
)


MAX_TRIP_DAYS = 365

TRIP_STATUSES = ("draft", "planned", "active", "completed", "cancelled")
VISIBILITIES = ("private", "public")
BUDGET_LEVELS = ("budget", "moderate", "luxury")
TRAVEL_STYLES = (
    "relaxed", "balanced", "packed",
    "luxury", "adventure", "cultural", "romantic", "family", "foodie",
)


class Activity(EmbeddedDocument):
    """One scheduled item inside a trip day."""

    name = StringField(required=True, max_length=200)
    description = StringField(default="", max_length=2000)
    start_time = StringField(default="", max_length=5)  # "HH:MM"
    duration_minutes = IntField(min_value=0, default=60)
    location_name = StringField(default="", max_length=250)
    latitude = FloatField(null=True)
    longitude = FloatField(null=True)
    # e.g. attraction | museum | food | transport | hotel | shopping | nature
    category = StringField(default="attraction", max_length=32)
    cost_estimate = FloatField(min_value=0, default=0)
    notes = StringField(default="", max_length=1000)

    def to_api_dict(self) -> dict:
        return {
            "name": self.name,
            "description": self.description,
            "start_time": self.start_time,
            "duration_minutes": self.duration_minutes,
            "location": self.location_name,
            "coordinates": {"lat": self.latitude, "lng": self.longitude},
            "category": self.category,
            "cost_estimate": round(self.cost_estimate, 2),
            "notes": self.notes,
        }


class ItineraryDay(EmbeddedDocument):
    day_number = IntField(required=True, min_value=1)
    date = DateField()
    title = StringField(default="", max_length=200)
    activities = ListField(EmbeddedDocumentField(Activity), default=list)

    def estimated_cost(self) -> float:
        return round(sum(a.cost_estimate or 0 for a in self.activities), 2)

    def to_api_dict(self) -> dict:
        return {
            "day_number": self.day_number,
            "date": self.date.isoformat() if self.date else None,
            "title": self.title,
            "estimated_cost": self.estimated_cost(),
            "activities": [a.to_api_dict() for a in self.activities],
        }


class TripCollaborator(EmbeddedDocument):
    user_public_id = StringField(required=True, max_length=32)
    email = StringField(required=True, max_length=255)
    name = StringField(default="", max_length=255)
    role = StringField(default="editor", choices=("owner", "editor", "viewer"), max_length=16)
    joined_at = DateTimeField()

    def to_api_dict(self) -> dict:
        return {
            "user_public_id": self.user_public_id,
            "email": self.email,
            "name": self.name,
            "role": self.role,
            "joined_at": self.joined_at.isoformat() if self.joined_at else None,
        }

class PollOption(EmbeddedDocument):
    option_id = StringField(required=True)
    text = StringField(required=True, max_length=200)
    voters = ListField(StringField(), default=list) # list of user_public_ids

class TripPoll(EmbeddedDocument):
    poll_id = StringField(required=True)
    created_by = StringField(required=True)
    question = StringField(required=True, max_length=300)
    options = ListField(EmbeddedDocumentField(PollOption), default=list)
    created_at = DateTimeField()

    def to_api_dict(self) -> dict:
        return {
            "id": self.poll_id,
            "created_by": self.created_by,
            "question": self.question,
            "options": [
                {"id": o.option_id, "text": o.text, "voters": o.voters, "votes_count": len(o.voters)}
                for o in self.options
            ],
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

class TripExpense(EmbeddedDocument):
    expense_id = StringField(required=True)
    title = StringField(required=True, max_length=200)
    amount = FloatField(required=True, min_value=0)
    paid_by = StringField(required=True)
    category = StringField(default="General", max_length=50)
    shared_with = ListField(StringField(), default=list) # user_public_ids
    created_at = DateTimeField()

    def to_api_dict(self) -> dict:
        return {
            "id": self.expense_id,
            "title": self.title,
            "amount": self.amount,
            "paid_by": self.paid_by,
            "category": self.category,
            "shared_with": self.shared_with,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

class PackingItem(EmbeddedDocument):
    item_id = StringField(required=True)
    title = StringField(required=True, max_length=200)
    category = StringField(default="Essentials", max_length=50)
    packed = BooleanField(default=False)

    def to_api_dict(self) -> dict:
        return {
            "id": self.item_id,
            "title": self.title,
            "category": self.category,
            "packed": self.packed,
        }

class JournalEntry(EmbeddedDocument):
    entry_id = StringField(required=True)
    day_number = IntField(default=1)
    title = StringField(required=True, max_length=200)
    content = StringField(default="", max_length=5000)
    photo_url = StringField(default="", max_length=500)
    created_at = DateTimeField()

    def to_api_dict(self) -> dict:
        return {
            "id": self.entry_id,
            "day_number": self.day_number,
            "title": self.title,
            "content": self.content,
            "photo_url": self.photo_url,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

class ActivityLog(EmbeddedDocument):
    log_id = StringField(required=True)
    user_public_id = StringField(required=True)
    action = StringField(required=True, max_length=300)
    created_at = DateTimeField()

    def to_api_dict(self) -> dict:
        return {
            "id": self.log_id,
            "user_public_id": self.user_public_id,
            "action": self.action,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

class Itinerary(EmbeddedDocument):
    days = ListField(EmbeddedDocumentField(ItineraryDay), default=list)

    def total_estimated_cost(self) -> float:
        return round(sum(d.estimated_cost() for d in self.days), 2)

    def to_api_dict(self) -> dict:
        return {
            "days": [d.to_api_dict() for d in self.days],
            "total_estimated_cost": self.total_estimated_cost(),
        }


class Trip(Document):
    owner_public_id = StringField(required=True, max_length=32)
    title = StringField(required=True, max_length=200)
    destination = StringField(required=True, max_length=200)
    start_date = DateField()
    end_date = DateField()
    duration_days = IntField(min_value=1, default=1)
    travelers = IntField(min_value=1, default=2)
    budget_amount = FloatField(min_value=0, null=True)
    budget_currency = StringField(default="USD", max_length=3)
    budget_level = StringField(default="moderate", choices=BUDGET_LEVELS, max_length=16)
    travel_style = StringField(default="balanced", max_length=16)
    interests = ListField(StringField(max_length=64), default=list)
    status = StringField(default="draft", choices=TRIP_STATUSES, max_length=16)
    visibility = StringField(default="private", choices=VISIBILITIES, max_length=16)
    notes = StringField(default="", max_length=5000)
    itinerary = EmbeddedDocumentField(Itinerary, default=Itinerary)
    # Trip Optimization Score (Phase 7)
    optimization_score = IntField(min_value=0, max_value=100, null=True)
    score_breakdown = DictField(default=dict)
    insights = ListField(StringField(max_length=300), default=list)
    collaborators = ListField(EmbeddedDocumentField(TripCollaborator), default=list)
    polls = ListField(EmbeddedDocumentField(TripPoll), default=list)
    expenses = ListField(EmbeddedDocumentField(TripExpense), default=list)
    packing_items = ListField(EmbeddedDocumentField(PackingItem), default=list)
    journal_entries = ListField(EmbeddedDocumentField(JournalEntry), default=list)
    activity_logs = ListField(EmbeddedDocumentField(ActivityLog), default=list)
    created_at = DateTimeField()
    updated_at = DateTimeField()


    meta = {
        "collection": "trips",
        "indexes": [
            "owner_public_id",
            "-created_at",
            ["owner_public_id", "status"],
            ["owner_public_id", "-created_at"],
        ],
        "ordering": ["-created_at"],
    }

    def save(self, *args, **kwargs):
        now = timezone.now()
        if self.created_at is None:
            self.created_at = now
        self.updated_at = now
        return super().save(*args, **kwargs)

    def recompute_duration(self) -> None:
        if self.start_date and self.end_date:
            delta = (self.end_date - self.start_date).days + 1
            self.duration_days = max(1, min(delta, MAX_TRIP_DAYS))

    def to_api_dict(self) -> dict:
        return {
            "id": str(self.id),
            "title": self.title,
            "destination": self.destination,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "duration_days": self.duration_days,
            "travelers": self.travelers,
            "budget": {
                "amount": self.budget_amount,
                "currency": self.budget_currency,
                "level": self.budget_level,
            },
            "travel_style": self.travel_style,
            "interests": self.interests,
            "status": self.status,
            "visibility": self.visibility,
            "notes": self.notes,
            "itinerary": self.itinerary.to_api_dict(),
            "optimization": {
                "score": self.optimization_score,
                "breakdown": self.score_breakdown or {},
                "insights": self.insights or [],
            },
            "collaborators": [c.to_api_dict() for c in self.collaborators],
            "polls": [p.to_api_dict() for p in self.polls],
            "expenses": [e.to_api_dict() for e in self.expenses],
            "packing_items": [pi.to_api_dict() for pi in self.packing_items],
            "journal_entries": [j.to_api_dict() for j in self.journal_entries],
            "activity_logs": [al.to_api_dict() for al in self.activity_logs],
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    @staticmethod
    def is_valid_object_id(value: str) -> bool:
        return bool(value) and ObjectId.is_valid(str(value))


