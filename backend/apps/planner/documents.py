"""Planner conversation & message documents."""
from django.utils import timezone
from mongoengine import (
    DateTimeField,
    DictField,
    Document,
    IntField,
    ObjectIdField,
    StringField,
)


class Conversation(Document):
    """A planning chat. ``requirements`` accumulates extracted trip facts."""

    owner_public_id = StringField(required=True, max_length=32)
    title = StringField(default="Trip planning", max_length=200)
    requirements = DictField(default=dict)
    last_trip_id = StringField(default="", max_length=32)
    message_count = IntField(default=0)
    created_at = DateTimeField()
    updated_at = DateTimeField()

    meta = {
        "collection": "conversations",
        "indexes": ["owner_public_id", "-updated_at"],
        "ordering": ["-updated_at"],
    }

    def save(self, *args, **kwargs):
        now = timezone.now()
        if self.created_at is None:
            self.created_at = now
        self.updated_at = now
        return super().save(*args, **kwargs)

    def to_api_dict(self) -> dict:
        return {
            "id": str(self.id),
            "title": self.title,
            "requirements": {k: v for k, v in self.requirements.items() if v},
            "last_trip_id": self.last_trip_id or None,
            "message_count": self.message_count,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class Message(Document):
    """One chat turn. ``info`` carries structured payload (exposed as 'meta'
    in the API — 'meta' itself is reserved by MongoEngine)."""

    ROLES = ("user", "assistant")

    conversation_id = ObjectIdField(required=True)
    owner_public_id = StringField(required=True, max_length=32)  # scoped queries
    role = StringField(required=True, choices=ROLES, max_length=16)
    content = StringField(required=True, max_length=8000)
    info = DictField(default=dict)
    created_at = DateTimeField()

    meta = {
        "collection": "messages",
        "indexes": ["conversation_id", ("conversation_id", "-created_at")],
        # _id is monotonic: stable ordering even when timestamps tie.
        "ordering": ["created_at", "_id"],
    }


    def save(self, *args, **kwargs):
        if self.created_at is None:
            self.created_at = timezone.now()
        return super().save(*args, **kwargs)

    def to_api_dict(self) -> dict:
        return {
            "id": str(self.id),
            "role": self.role,
            "content": self.content,
            "meta": dict(self.info or {}),
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

