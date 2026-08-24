"""Planner (conversational AI) API endpoints."""
import logging

from bson import ObjectId
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from apps.ai.orchestrator import process_user_message
from apps.common.pagination import paginate_mongo_queryset
from apps.common.responses import success_response
from apps.planner.documents import Conversation, Message
from apps.planner.serializers import CreateConversationSerializer, SendMessageSerializer

logger = logging.getLogger(__name__)


class AIThrottle(ScopedRateThrottle):
    """Expensive AI operations get their own rate-limit scope."""

    throttle_scope = "ai"


def _get_conversation(request, conversation_id: str) -> Conversation:
    if not ObjectId.is_valid(str(conversation_id)):
        raise NotFound("Conversation not found.")
    conversation = Conversation.objects(
        id=str(conversation_id), owner_public_id=request.user.public_id
    ).first()
    if conversation is None:
        raise NotFound("Conversation not found.")
    return conversation


class ConversationListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["planner"])
    def get(self, request):
        page = paginate_mongo_queryset(
            Conversation.objects(owner_public_id=request.user.public_id), request,
            default_size=10,
        )
        results = page.pop("results")
        page.pop("_page_meta")
        return success_response({**page, "results": [c.to_api_dict() for c in results]})

    @extend_schema(tags=["planner"])
    def post(self, request):
        serializer = CreateConversationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        conversation = Conversation(
            owner_public_id=request.user.public_id, **serializer.validated_data
        )
        conversation.save()
        greeting = Message(
            conversation_id=conversation.id,
            owner_public_id=request.user.public_id,
            role="assistant",
            content=(
                "Hi! I'm your WanderSync travel planner ✈️ Tell me about the trip "
                "you're dreaming of — destination, how long, budget, interests — "
                "and I'll craft a day-by-day itinerary for you."
            ),
            info={"type": "greeting"},
        )
        greeting.save()
        conversation.modify(message_count=1)
        return success_response(
            {
                "conversation": conversation.to_api_dict(),
                "messages": [greeting.to_api_dict()],
            },
            message="Conversation started.",
            status=status.HTTP_201_CREATED,
        )


class ConversationDetailView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["planner"])
    def get(self, request, conversation_id: str):
        conversation = _get_conversation(request, conversation_id)
        messages = Message.objects(conversation_id=conversation.id).order_by("created_at")
        return success_response(
            {
                "conversation": conversation.to_api_dict(),
                "messages": [m.to_api_dict() for m in messages],
            }
        )

    @extend_schema(tags=["planner"])
    def delete(self, request, conversation_id: str):
        conversation = _get_conversation(request, conversation_id)
        Message.objects(conversation_id=conversation.id).delete()
        conversation.delete()
        return success_response(message="Conversation deleted.")


class ConversationMessagesView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [AIThrottle]

    @extend_schema(tags=["planner"])
    def get(self, request, conversation_id: str):
        conversation = _get_conversation(request, conversation_id)
        page = paginate_mongo_queryset(
            Message.objects(conversation_id=conversation.id), request,
            default_size=50,
        )
        results = page.pop("results")
        page.pop("_page_meta")
        return success_response({**page, "results": [m.to_api_dict() for m in results]})

    @extend_schema(request=SendMessageSerializer, tags=["planner"])
    def post(self, request, conversation_id: str):
        conversation = _get_conversation(request, conversation_id)
        serializer = SendMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        content = serializer.validated_data["content"]

        user_message = Message(
            conversation_id=conversation.id,
            owner_public_id=request.user.public_id,
            role="user",
            content=content,
        )
        user_message.save()

        recent = [
            m.content
            for m in Message.objects(conversation_id=conversation.id).order_by("-id")[:6]
        ]
        recent.reverse()


        result = process_user_message(conversation, content, recent)

        assistant_message = Message(
            conversation_id=conversation.id,
            owner_public_id=request.user.public_id,
            role="assistant",
            content=result["reply"],
            info=result["meta"] or {},
        )
        assistant_message.save()

        conversation.modify(
            message_count=(conversation.message_count or 0) + 2,
            updated_at=timezone.now(),
        )

        payload = {
            "user_message": user_message.to_api_dict(),
            "assistant_message": assistant_message.to_api_dict(),
        }
        if result["trip"] is not None:
            payload["trip"] = result["trip"].to_api_dict()
        return success_response(payload, message="Reply generated.")
