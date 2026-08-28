"""MongoEngine data models for accounts.

Django's relational auth stack is intentionally unused (MongoDB is the primary
datastore). Password hashing reuses Django's battle-tested PBKDF2 hasher so
credentials never touch the database in plain text.
"""
import uuid

from django.contrib.auth.hashers import check_password, make_password
from django.utils import timezone
from mongoengine import (
    BooleanField,
    DateTimeField,
    Document,
    EmailField,
    EmbeddedDocument,
    EmbeddedDocumentField,
    IntField,
    ListField,
    StringField,
)


class NotificationPreferences(EmbeddedDocument):
    """Per-user opt-in/opt-out switches for system notifications."""

    trip_saved = BooleanField(default=True)
    itinerary_generated = BooleanField(default=True)
    collaboration_updates = BooleanField(default=True)
    export_completed = BooleanField(default=True)
    product_updates = BooleanField(default=False)

    def __str__(self) -> str:  # pragma: no cover - debug convenience
        return f"Notifications(trip_saved={self.trip_saved})"


class TravelProfile(EmbeddedDocument):
    """Personalisation signals collected at signup and refined over time."""

    avatar_url = StringField(default="", max_length=500)
    home_city = StringField(default="", max_length=120)
    preferred_currency = StringField(default="USD", max_length=3)
    # relaxed | balanced | packed | luxury | adventure | cultural | romantic | family | foodie
    travel_style = StringField(default="balanced", max_length=32)
    interests = ListField(StringField(max_length=64), default=list)
    accommodation_preference = StringField(default="", max_length=64)
    transportation_preference = StringField(default="", max_length=64)
    dietary_preferences = ListField(StringField(max_length=64), default=list)
    accessibility_preferences = ListField(StringField(max_length=128), default=list)

    def __str__(self) -> str:  # pragma: no cover - debug convenience
        return f"TravelProfile(currency={self.preferred_currency}, style={self.travel_style})"


class User(Document):
    """Application user. ``public_id`` is what appears inside JWTs."""

    public_id = StringField(
        required=True,
        unique=True,
        default=lambda: uuid.uuid4().hex,
        max_length=32,
    )
    email = EmailField(required=True, unique=True, max_length=254)
    password = StringField(required=True)  # always stored hashed
    full_name = StringField(default="", max_length=120)
    is_active = BooleanField(default=True)
    email_verified = BooleanField(default=False)
    # Email OTP verification: the code itself is never stored in plain text.
    otp_hash = StringField(default="", max_length=256)
    otp_expires_at = DateTimeField()
    otp_attempts = IntField(default=0)
    otp_last_sent_at = DateTimeField()
    profile = EmbeddedDocumentField(TravelProfile, default=TravelProfile)
    notifications = EmbeddedDocumentField(
        NotificationPreferences, default=NotificationPreferences
    )
    last_login = DateTimeField()
    # Managed explicitly (mongoengine's `timestamps` option does not populate
    # the in-memory instance on save).
    created_at = DateTimeField()
    updated_at = DateTimeField()

    meta = {
        "collection": "users",
        "indexes": ["email", "public_id", "-created_at"],
        "ordering": ["-created_at"],
    }

    def save(self, *args, **kwargs):
        now = timezone.now()
        if self.created_at is None:
            self.created_at = now
        self.updated_at = now
        return super().save(*args, **kwargs)


    # -- credential helpers -------------------------------------------------
    def set_password(self, raw_password: str) -> None:
        self.password = make_password(raw_password)

    def check_password(self, raw_password: str) -> bool:
        return check_password(raw_password, self.password)

    # -- DRF compatibility --------------------------------------------------
    @property
    def is_authenticated(self) -> bool:
        return self.pk is not None

    @property
    def is_anonymous(self) -> bool:
        return self.pk is None

    def to_safe_dict(self) -> dict:
        """Public representation — NEVER includes the password hash."""
        return {
            "id": self.public_id,
            "email": self.email,
            "full_name": self.full_name,
            "is_active": self.is_active,
            "email_verified": bool(self.email_verified),
            "profile": {field: getattr(self.profile, field) for field in (
                "avatar_url",
                "home_city",
                "preferred_currency",
                "travel_style",
                "interests",
                "accommodation_preference",
                "transportation_preference",
                "dietary_preferences",
                "accessibility_preferences",
            )},
            "notifications": {field: getattr(self.notifications, field) for field in (
                "trip_saved",
                "itinerary_generated",
                "collaboration_updates",
                "export_completed",
                "product_updates",
            )},
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __str__(self) -> str:
        return f"User<{self.email}>"
