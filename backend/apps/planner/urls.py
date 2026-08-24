"""URL routes for the planner (/api/v1/planner/)."""
from django.urls import path

from apps.planner.views import (
    ConversationDetailView,
    ConversationListCreateView,
    ConversationMessagesView,
)

urlpatterns = [
    path("conversations/", ConversationListCreateView.as_view(), name="conversation-list-create"),
    path(
        "conversations/<str:conversation_id>/",
        ConversationDetailView.as_view(),
        name="conversation-detail",
    ),
    path(
        "conversations/<str:conversation_id>/messages/",
        ConversationMessagesView.as_view(),
        name="conversation-messages",
    ),
]
