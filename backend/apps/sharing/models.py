"""Share-link documents."""
import uuid

from django.utils import timezone
from mongoengine import BooleanField, DateTimeField, Document, IntField, ObjectIdField, StringField


class SharedTrip(Document):
    """A public share token for one trip. One active link per trip."""

    trip_id = ObjectIdField(required=True, unique=True)
    owner_public_id = StringField(required=True, max_length=32)
    token = StringField(required=True, unique=True, default=lambda: uuid.uuid4().hex)
    revoked = BooleanField(default=False)
    views = IntField(default=0)
    created_at = DateTimeField()

    meta = {"collection": "shared_trips", "indexes": ["token", "trip_id"]}

    def save(self, *args, **kwargs):
        if self.created_at is None:
            self.created_at = timezone.now()
        return super().save(*args, **kwargs)
