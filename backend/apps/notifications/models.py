"""In-app notification documents."""
from django.utils import timezone
from mongoengine import BooleanField, DateTimeField, Document, ObjectIdField, StringField


class Notification(Document):
    KINDS = (
        "trip_saved", "itinerary_generated", "share_created",
        "export_completed", "system",
    )

    owner_public_id = StringField(required=True, max_length=32)
    kind = StringField(required=True, choices=KINDS, max_length=32)
    title = StringField(required=True, max_length=200)
    body = StringField(default="", max_length=500)
    link = StringField(default="", max_length=300)  # in-app route
    read = BooleanField(default=False)
    created_at = DateTimeField()

    meta = {
        "collection": "notifications",
        "indexes": ["owner_public_id", "-created_at"],
        "ordering": ["-created_at"],
    }

    def save(self, *args, **kwargs):
        if self.created_at is None:
            self.created_at = timezone.now()
        return super().save(*args, **kwargs)

    def to_api_dict(self) -> dict:
        return {
            "id": str(self.id),
            "kind": self.kind,
            "title": self.title,
            "body": self.body,
            "link": self.link,
            "read": self.read,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }