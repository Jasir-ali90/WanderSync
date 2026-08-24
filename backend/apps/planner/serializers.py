"""Planner request validation."""
from rest_framework import serializers


class CreateConversationSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=200, required=False, default="Trip planning")

    def validate_title(self, value: str) -> str:
        return value.strip() or "Trip planning"


class SendMessageSerializer(serializers.Serializer):
    content = serializers.CharField(min_length=1, max_length=4000)

    def validate_content(self, value: str) -> str:
        return value.strip()
