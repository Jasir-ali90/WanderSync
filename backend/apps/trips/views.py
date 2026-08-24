"""Trip API endpoints.

Ownership is enforced server-side: every query is scoped to the requesting
user, and detail access to another user's trip returns 404 (existence is not
leaked) rather than 403.
"""
import logging

from bson import ObjectId
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.common.pagination import paginate_mongo_queryset
from apps.common.responses import error_response, success_response
from apps.trips.documents import TRIP_STATUSES, Trip
from apps.trips.serializers import TripWriteSerializer

logger = logging.getLogger(__name__)



class TripListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["trips"])
    def get(self, request):
        queryset = Trip.objects(owner_public_id=request.user.public_id)

        # --- filters -----------------------------------------------------
        trip_status = request.query_params.get("status")
        if trip_status:
            if trip_status not in TRIP_STATUSES:
                return error_response(
                    f"'{trip_status}' is not a valid trip status.",
                    code="VALIDATION_ERROR",
                )
            queryset = queryset.filter(status=trip_status)

        destination = request.query_params.get("destination", "").strip()
        if destination:
            queryset = queryset.filter(destination__icontains=destination)

        page_data = paginate_mongo_queryset(queryset.order_by("-created_at"), request)
        results = page_data.pop("results")
        page_data.pop("_page_meta")
        return success_response(
            {**page_data, "results": [t.to_api_dict() for t in results]},
        )


    @extend_schema(request=TripWriteSerializer, tags=["trips"])
    def post(self, request):
        serializer = TripWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        trip = serializer.save()
        trip.owner_public_id = request.user.public_id
        trip.save()
        logger.info("Trip created %s by %s", trip.id, request.user.email)
        return success_response(
            {"trip": trip.to_api_dict()},
            message="Trip created successfully.",
            status=status.HTTP_201_CREATED,
        )


class TripDetailView(APIView):

    permission_classes = [IsAuthenticated]

    def _get_trip(self, request, trip_id: str) -> Trip:
        if not ObjectId.is_valid(str(trip_id)):
            raise NotFound("Trip not found.")
        trip = Trip.objects(
            id=str(trip_id), owner_public_id=request.user.public_id
        ).first()
        if trip is None:
            raise NotFound("Trip not found.")
        return trip

    @extend_schema(tags=["trips"])
    def get(self, request, trip_id: str):
        trip = self._get_trip(request, trip_id)
        return success_response({"trip": trip.to_api_dict()})

    @extend_schema(request=TripWriteSerializer, tags=["trips"])
    def patch(self, request, trip_id: str):
        trip = self._get_trip(request, trip_id)
        serializer = TripWriteSerializer(trip, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        logger.info("Trip updated %s by %s", trip.id, request.user.email)
        return success_response(
            {"trip": trip.to_api_dict()}, message="Trip updated successfully."
        )

    @extend_schema(tags=["trips"])
    def delete(self, request, trip_id: str):
        trip = self._get_trip(request, trip_id)
        trip.delete()
        logger.info("Trip deleted %s by %s", trip_id, request.user.email)
        return success_response(message="Trip deleted successfully.")


class TripStatsView(APIView):

    """Aggregated trip statistics for the signed-in user's dashboard."""

    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["trips"])
    def get(self, request):
        own = Trip.objects(owner_public_id=request.user.public_id)
        by_status = {
            s: own.filter(status=s).count() for s in TRIP_STATUSES
        }
        destinations = Trip.objects(owner_public_id=request.user.public_id).distinct(
            "destination"
        )
        total_days = sum(
            t.duration_days for t in own.only("duration_days")
        )
        return success_response(
            {
                "total_trips": own.count(),
                "by_status": by_status,
                "total_planned_days": total_days,
                "unique_destinations": len(destinations),
                "destinations": destinations[:20],
            }
        )

