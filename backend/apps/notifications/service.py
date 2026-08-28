"""Notification creation helper + API endpoints."""
import logging

from apps.common.responses import success_response
from apps.notifications.models import Notification
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

logger = logging.getLogger(__name__)


def notify(owner_public_id: str, kind: str, title: str, body: str = "", link: str = "") -> None:
    """Create an in-app notification."""
    try:
        Notification(
            owner_public_id=owner_public_id,
            kind=kind if kind in Notification.KINDS else "system",
            title=title[:200],
            body=body[:500],
            link=link[:300],
        ).save()
    except Exception:  # pragma: no cover — notifications must never break flows
        logger.warning("Failed to create notification", exc_info=True)


def notify_itinerary_generated(owner_public_id: str, trip_id: str, title: str) -> None:
    notify(
        owner_public_id,
        "itinerary_generated",
        "Itinerary ready ✨",
        f"Your trip “{title}” has been generated and saved.",
        link=f"/trips/{trip_id}",
    )


def notify_share_created(owner_public_id: str, trip_id: str) -> None:
    notify(
        owner_public_id,
        "share_created",
        "Share link created 🔗",
        "A public share link is now active for this trip.",
        link=f"/trips/{trip_id}",
    )


def notify_export_completed(owner_public_id: str, trip_id: str, fmt: str) -> None:
    notify(
        owner_public_id,
        "export_completed",
        f"{fmt.upper()} export ready 📄",
        "Your export was generated successfully.",
        link=f"/trips/{trip_id}",
    )


class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        rows = Notification.objects(owner_public_id=request.user.public_id)[:50]
        unread = Notification.objects(
            owner_public_id=request.user.public_id, read=False
        ).count()
        return success_response(
            {
                "unread": unread,
                "results": [n.to_api_dict() for n in rows],
            }
        )


class NotificationReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Notification.objects(owner_public_id=request.user.public_id).update(read=True)
        return success_response(message="All notifications marked as read.")