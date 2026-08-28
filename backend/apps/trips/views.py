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
        # Return trips where user is owner OR listed as collaborator
        queryset = Trip.objects(
            __raw__={
                "$or": [
                    {"owner_public_id": request.user.public_id},
                    {"collaborators.user_public_id": request.user.public_id},
                ]
            }
        )

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
            __raw__={
                "_id": ObjectId(str(trip_id)),
                "$or": [
                    {"owner_public_id": request.user.public_id},
                    {"collaborators.user_public_id": request.user.public_id},
                ],
            }
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


class TripBudgetView(TripDetailView):
    """Calculated budget breakdown for an owned trip (owner-scoped)."""

    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["trips"])
    def get(self, request, trip_id: str):
        from apps.trips.budget import build_budget_breakdown

        trip = self._get_trip(request, trip_id)
        return success_response({"budget": build_budget_breakdown(trip)})


class TripGeocodeView(TripDetailView):
    """Resolve missing activity coordinates via the places provider."""

    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["trips"])
    def post(self, request, trip_id: str):
        from apps.trips.geocode import fill_missing_coordinates

        trip = self._get_trip(request, trip_id)
        summary = fill_missing_coordinates(trip)
        logger.info(
            "Geocoded trip %s: %s/%s resolved", trip.id, summary["resolved"], summary["attempted"]
        )
        return success_response(summary, message="Map locations updated.")


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
        return success_response(
            {
                "total_trips": own.count(),
                "by_status": by_status,
                "unique_destinations": len(destinations),
            }
        )


class TripCollaboratorsView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_trip(self, request, trip_id: str) -> Trip:
        if not ObjectId.is_valid(str(trip_id)):
            raise NotFound("Trip not found.")
        trip = Trip.objects(
            __raw__={
                "_id": ObjectId(str(trip_id)),
                "$or": [
                    {"owner_public_id": request.user.public_id},
                    {"collaborators.user_public_id": request.user.public_id},
                ],
            }
        ).first()
        if trip is None:
            raise NotFound("Trip not found.")
        return trip

    def post(self, request, trip_id: str):
        import uuid
        from django.utils import timezone
        from apps.trips.documents import TripCollaborator, ActivityLog

        trip = self._get_trip(request, trip_id)
        email = request.data.get("email", "").strip().lower()
        role = request.data.get("role", "editor")
        if not email:
            return error_response("Email is required.")

        # Avoid duplicates
        existing = [c for c in trip.collaborators if c.email == email]
        if existing:
            return error_response("Member is already in this trip.")

        collab = TripCollaborator(
            user_public_id=f"usr_{uuid.uuid4().hex[:12]}",
            email=email,
            name=email.split("@")[0].capitalize(),
            role=role,
            joined_at=timezone.now(),
        )
        trip.collaborators.append(collab)
        trip.activity_logs.append(ActivityLog(
            log_id=uuid.uuid4().hex[:8],
            user_public_id=request.user.public_id,
            action=f"Invited {email} as {role}",
            created_at=timezone.now()
        ))
        trip.save()
        return success_response({"collaborators": [c.to_api_dict() for c in trip.collaborators]}, message=f"Invited {email}")


class TripPollsView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_trip(self, request, trip_id: str) -> Trip:
        if not ObjectId.is_valid(str(trip_id)):
            raise NotFound("Trip not found.")
        trip = Trip.objects(
            __raw__={
                "_id": ObjectId(str(trip_id)),
                "$or": [
                    {"owner_public_id": request.user.public_id},
                    {"collaborators.user_public_id": request.user.public_id},
                ],
            }
        ).first()
        if trip is None:
            raise NotFound("Trip not found.")
        return trip

    def post(self, request, trip_id: str):
        import uuid
        from django.utils import timezone
        from apps.trips.documents import TripPoll, PollOption, ActivityLog

        trip = self._get_trip(request, trip_id)
        question = request.data.get("question", "").strip()
        options_text = request.data.get("options", [])
        if not question or not options_text:
            return error_response("Question and options are required.")

        options = [
            PollOption(option_id=f"opt_{idx}", text=opt, voters=[])
            for idx, opt in enumerate(options_text)
        ]
        poll = TripPoll(
            poll_id=f"poll_{uuid.uuid4().hex[:8]}",
            created_by=request.user.public_id,
            question=question,
            options=options,
            created_at=timezone.now(),
        )
        trip.polls.append(poll)
        trip.activity_logs.append(ActivityLog(
            log_id=uuid.uuid4().hex[:8],
            user_public_id=request.user.public_id,
            action=f"Created poll: {question}",
            created_at=timezone.now()
        ))
        trip.save()
        return success_response({"polls": [p.to_api_dict() for p in trip.polls]}, message="Poll created.")


class TripPollVoteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, trip_id: str, poll_id: str):
        import uuid
        from django.utils import timezone
        from apps.trips.documents import Trip, ActivityLog

        trip = Trip.objects(
            __raw__={
                "_id": ObjectId(str(trip_id)),
                "$or": [
                    {"owner_public_id": request.user.public_id},
                    {"collaborators.user_public_id": request.user.public_id},
                ],
            }
        ).first()
        if not trip:
            raise NotFound("Trip not found.")

        option_id = request.data.get("option_id")
        user_id = request.user.public_id

        poll = next((p for p in trip.polls if p.poll_id == poll_id), None)
        if not poll:
            raise NotFound("Poll not found.")

        for opt in poll.options:
            if user_id in opt.voters:
                opt.voters.remove(user_id)
            if opt.option_id == option_id:
                opt.voters.append(user_id)

        trip.activity_logs.append(ActivityLog(
            log_id=uuid.uuid4().hex[:8],
            user_public_id=user_id,
            action=f"Voted on poll: {poll.question}",
            created_at=timezone.now()
        ))
        trip.save()
        return success_response({"polls": [p.to_api_dict() for p in trip.polls]}, message="Vote recorded.")


class TripExpensesView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, trip_id: str):
        import uuid
        from django.utils import timezone
        from apps.trips.documents import Trip, TripExpense, ActivityLog

        trip = Trip.objects(
            __raw__={
                "_id": ObjectId(str(trip_id)),
                "$or": [
                    {"owner_public_id": request.user.public_id},
                    {"collaborators.user_public_id": request.user.public_id},
                ],
            }
        ).first()
        if not trip:
            raise NotFound("Trip not found.")

        title = request.data.get("title", "").strip()
        amount = float(request.data.get("amount", 0))
        paid_by = request.data.get("paid_by", request.user.public_id)
        category = request.data.get("category", "General")
        shared_with = request.data.get("shared_with", [])

        if not title or amount <= 0:
            return error_response("Valid title and amount required.")

        expense = TripExpense(
            expense_id=f"exp_{uuid.uuid4().hex[:8]}",
            title=title,
            amount=amount,
            paid_by=paid_by,
            category=category,
            shared_with=shared_with,
            created_at=timezone.now()
        )
        trip.expenses.append(expense)
        trip.activity_logs.append(ActivityLog(
            log_id=uuid.uuid4().hex[:8],
            user_public_id=request.user.public_id,
            action=f"Added expense: {title} ({amount} {trip.budget_currency})",
            created_at=timezone.now()
        ))
        trip.save()
        return success_response({"expenses": [e.to_api_dict() for e in trip.expenses]}, message="Expense added.")
