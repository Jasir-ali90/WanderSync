"""Share-link API: create/revoke (owner) and public anonymous view.

Public payloads strip private notes — only trip content is shared.
"""
import logging

from bson import ObjectId
from drf_spectacular.utils import extend_schema
from rest_framework.exceptions import NotFound
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework.throttling import ScopedRateThrottle

from apps.common.responses import success_response
from apps.sharing.models import SharedTrip
from apps.trips.documents import Trip

logger = logging.getLogger(__name__)


def _get_own_trip(request, trip_id: str) -> Trip:
    if not ObjectId.is_valid(str(trip_id)):
        raise NotFound("Trip not found.")
    trip = Trip.objects(id=str(trip_id), owner_public_id=request.user.public_id).first()
    if trip is None:
        raise NotFound("Trip not found.")
    return trip


class ShareLinkView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["sharing"])
    def post(self, request, trip_id: str):
        """Create (or return the existing) share link for a trip."""
        trip = _get_own_trip(request, trip_id)
        link = SharedTrip.objects(trip_id=trip.id).first()
        if link is None or link.revoked:
            if link is None:
                link = SharedTrip(trip_id=trip.id, owner_public_id=request.user.public_id)
            else:
                link.revoked = False
            link.save()
            trip.modify(visibility="public")
        logger.info("Share link issued for trip %s", trip.id)
        from apps.notifications.service import notify_share_created

        notify_share_created(request.user.public_id, str(trip.id))
        return success_response(
            {"token": link.token, "url": f"/shared/{link.token}", "views": link.views},
            message="Share link ready.",
        )

    @extend_schema(tags=["sharing"])
    def delete(self, request, trip_id: str):
        """Revoke the share link; trip returns to private visibility."""
        trip = _get_own_trip(request, trip_id)
        link = SharedTrip.objects(trip_id=trip.id).first()
        if link is not None:
            link.modify(revoked=True)
        trip.modify(visibility="private")
        return success_response(message="Share link revoked.")


class SharedTripView(APIView):
    """Anonymous read-only view of a shared itinerary."""

    permission_classes = [AllowAny]  # global anonymous throttle applies

    @extend_schema(tags=["sharing"], auth=[])
    def get(self, request, token: str):
        link = SharedTrip.objects(token=str(token), revoked=False).first()
        if link is None:
            raise NotFound("This share link is invalid or has been revoked.")
        trip = Trip.objects(id=link.trip_id).first()
        if trip is None:
            raise NotFound("The shared trip no longer exists.")

        payload = trip.to_api_dict()
        # Privacy: private notes never leave the owner's account.
        payload.pop("notes", None)

        link.modify(views=link.views + 1)
        return success_response({"trip": payload})

