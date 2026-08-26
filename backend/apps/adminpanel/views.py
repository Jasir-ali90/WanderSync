"""Admin panel API — staff-only management of users, trips and platform stats."""
import logging

from bson import ObjectId
from drf_spectacular.utils import extend_schema
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.accounts.documents import User
from apps.common.permissions import IsStaff
from apps.common.responses import success_response
from apps.planner.documents import Conversation, Message
from apps.trips.documents import Trip

logger = logging.getLogger(__name__)


def _resolve_user(user_id: str) -> User:
    user = User.objects(public_id=str(user_id)).first() or (
        User.objects(id=user_id).first() if ObjectId.is_valid(str(user_id)) else None
    )
    if user is None:
        raise NotFound("User not found.")
    return user


def _user_row(user: User) -> dict:
    trip_count = Trip.objects(owner_public_id=user.public_id).count()
    return {
        "id": user.public_id,
        "email": user.email,
        "full_name": user.full_name,
        "is_active": user.is_active,
        "is_staff": user.is_staff,
        "trip_count": trip_count,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "last_login": user.last_login.isoformat() if user.last_login else None,
    }


class AdminStatsView(APIView):
    permission_classes = [IsAuthenticated, IsStaff]

    @extend_schema(tags=["admin"])
    def get(self, request):
        from django.conf import settings

        users = User.objects
        trips = Trip.objects
        conversations = Conversation.objects

        destinations: dict[str, int] = {}
        for t in trips.only("destination"):
            key = t.destination or "Unknown"
            destinations[key] = destinations.get(key, 0) + 1
        top_destinations = sorted(destinations.items(), key=lambda kv: -kv[1])[:6]

        # NOTE: "type" collides with Mongo's $type operator in field lookups,
        # so this query uses a raw filter.
        generations = Message.objects(__raw__={"info.type": "itinerary_generated"}).count()

        return success_response(
            {
                "total_users": users.count(),
                "active_users": users.filter(is_active=True).count(),
                "staff_users": users.filter(is_staff=True).count(),
                "total_trips": trips.count(),
                "total_conversations": conversations.count(),
                "ai_generations": generations,
                "top_destinations": [
                    {"destination": name, "trips": count}
                    for name, count in top_destinations
                ],
                "ai_enabled": bool(settings.OPENAI_API_KEY),
            }
        )


class AdminUsersView(APIView):
    permission_classes = [IsAuthenticated, IsStaff]

    @extend_schema(tags=["admin"])
    def get(self, request):
        queryset = User.objects.order_by("-created_at")
        query = (request.query_params.get("q") or "").strip().lower()
        if query:
            queryset = queryset.filter(email__icontains=query)
        rows = [_user_row(u) for u in queryset[:50]]
        return success_response({"count": len(rows), "results": rows})


class AdminUserDetailView(APIView):
    permission_classes = [IsAuthenticated, IsStaff]

    @extend_schema(tags=["admin"])
    def patch(self, request, user_id: str):
        user = _resolve_user(user_id)
        payload = request.data or {}
        if "is_active" in payload:
            if not isinstance(payload["is_active"], bool):
                raise ValidationError({"is_active": "Must be true or false."})
            if user.public_id == request.user.public_id:
                raise ValidationError({"is_active": "You cannot deactivate yourself."})
            user.is_active = payload["is_active"]
        if "is_staff" in payload:
            if not isinstance(payload["is_staff"], bool):
                raise ValidationError({"is_staff": "Must be true or false."})
            user.is_staff = payload["is_staff"]
        user.save()
        logger.info("Admin %s updated user %s", request.user.email, user.email)
        return success_response({"user": _user_row(user)}, message="User updated.")

    @extend_schema(tags=["admin"])
    def delete(self, request, user_id: str):
        user = _resolve_user(user_id)
        if user.public_id == request.user.public_id:
            raise ValidationError("You cannot delete your own admin account.")
        email = user.email
        owner = user.public_id
        Trip.objects(owner_public_id=owner).delete()
        conversations = Conversation.objects(owner_public_id=owner)
        for conversation in conversations.only("id"):
            Message.objects(conversation_id=conversation.id).delete()
        conversations.delete()
        user.delete()
        logger.info("Admin %s deleted user %s", request.user.email, email)
        return success_response(message=f"User {email} and all their data deleted.")


class AdminTripsView(APIView):
    permission_classes = [IsAuthenticated, IsStaff]

    @extend_schema(tags=["admin"])
    def get(self, request):
        queryset = Trip.objects.order_by("-created_at")
        query = (request.query_params.get("q") or "").strip()
        if query:
            queryset = queryset.filter(destination__icontains=query)

        owners = {
            u.public_id: u.email for u in User.objects.only("public_id", "email")
        }
        rows = []
        for t in queryset[:50]:
            row = t.to_api_dict()
            row["owner_email"] = owners.get(t.owner_public_id, "unknown")
            rows.append(row)
        return success_response({"count": len(rows), "results": rows})


class AdminTripDetailView(APIView):
    permission_classes = [IsAuthenticated, IsStaff]

    @extend_schema(tags=["admin"])
    def delete(self, request, trip_id: str):
        if not ObjectId.is_valid(str(trip_id)):
            raise NotFound("Trip not found.")
        trip = Trip.objects(id=str(trip_id)).first()
        if trip is None:
            raise NotFound("Trip not found.")
        destination = trip.destination
        trip.delete()
        logger.info(
            "Admin %s deleted trip %s (%s)", request.user.email, trip_id, destination
        )
        return success_response(message="Trip deleted.")