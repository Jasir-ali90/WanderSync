"""Request/response validation for account endpoints."""
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from apps.accounts.documents import User
from apps.accounts.services import authenticate_user, normalize_email



class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=254)
    full_name = serializers.CharField(max_length=120, required=False, default="", allow_blank=True)
    password = serializers.CharField(
        max_length=128,
        write_only=True,
        style={"input_type": "password"},
    )

    def validate_email(self, value: str) -> str:
        if value != value.lower():
            raise serializers.ValidationError(
                "Email must be in lowercase letters only. Please rewrite it without capital letters.",
                code="EMAIL_NOT_LOWERCASE",
            )
        return normalize_email(value)

    def validate_full_name(self, value: str) -> str:
        from apps.accounts.services import validate_full_name as validate_name

        return validate_name(value)

    def validate_password(self, value: str) -> str:
        # Against an empty attribute set so "similarity" checks don't crash.
        validate_password(value)
        return value

    def validate(self, attrs):
        if User.objects(email=attrs["email"]).only("id").first():
            raise serializers.ValidationError(
                "An account with this email already exists.",
                code="EMAIL_EXISTS",
            )
        return attrs

    def create(self, validated_data):
        from apps.accounts.services import create_user

        return create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            full_name=validated_data.get("full_name", ""),
        )


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=254)
    password = serializers.CharField(
        max_length=128,
        write_only=True,
        style={"input_type": "password"},
    )

    def validate(self, attrs):
        user = authenticate_user(
            email=attrs.get("email", ""),
            password=attrs.get("password", ""),
        )
        if user is None:
            existing = User.objects(email=normalize_email(attrs.get("email", ""))).first()
            # Accounts awaiting OTP activation are inactive; existing verified
            # accounts must keep working, so only pending users get the
            # "verify your email" gate.
            if existing is not None and not existing.is_active:
                raise serializers.ValidationError(
                    "Please verify your email before signing in. Enter the code we emailed you.",
                    code="EMAIL_UNVERIFIED",
                )
            raise serializers.ValidationError(
                "Incorrect email or password.",
                code="invalid_credentials",
            )
        attrs["user"] = user
        return attrs


class ProfileUpdateSerializer(serializers.Serializer):
    """Editable subset of the embedded travel profile + display name."""

    full_name = serializers.CharField(max_length=120, required=False, allow_blank=True)

    # CharField (not URLField) so uploaded avatars can be stored as small
    # canvas-resized data URLs as well as remote URLs.
    avatar_url = serializers.CharField(required=False, allow_blank=True, max_length=150_000)
    home_city = serializers.CharField(required=False, allow_blank=True, max_length=120)
    preferred_currency = serializers.CharField(required=False, min_length=3, max_length=3)
    travel_style = serializers.ChoiceField(
        required=False,
        choices=[
            "relaxed", "balanced", "packed",
            "luxury", "adventure", "cultural", "romantic", "family", "foodie",
        ],
    )
    interests = serializers.ListField(
        child=serializers.CharField(max_length=64),
        required=False,
        max_length=30,
    )
    accommodation_preference = serializers.CharField(required=False, allow_blank=True, max_length=64)
    transportation_preference = serializers.CharField(required=False, allow_blank=True, max_length=64)
    dietary_preferences = serializers.ListField(
        child=serializers.CharField(max_length=64), required=False, max_length=20
    )
    accessibility_preferences = serializers.ListField(
        child=serializers.CharField(max_length=128), required=False, max_length=10
    )

    PROFILE_FIELDS = {
        "avatar_url", "home_city", "preferred_currency", "travel_style",
        "interests", "accommodation_preference", "transportation_preference",
        "dietary_preferences", "accessibility_preferences",
    }

    def update(self, instance: User, validated_data):
        for field in self.PROFILE_FIELDS:
            if field in validated_data:
                setattr(instance.profile, field, validated_data[field])
        if "full_name" in validated_data:
            instance.full_name = validated_data["full_name"].strip()[:120]
        instance.save()
        return instance


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True, style={"input_type": "password"})
    new_password = serializers.CharField(write_only=True, style={"input_type": "password"})

    def validate_current_password(self, value: str) -> str:
        user: User = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def validate_new_password(self, value: str) -> str:
        user: User = self.context["request"].user
        validate_password(value, user=_PasswordHolder(user))
        return value

    def save(self, **kwargs):
        user: User = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save()
        return user


class _PasswordHolder:
    """Minimal adapter so password validators can inspect the user."""

    def __init__(self, user: User):
        self.username = user.email
        self.email = user.email
        self.full_name = user.full_name
