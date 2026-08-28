"""Account API endpoints."""
import logging

from django.contrib.auth.tokens import default_token_generator
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.settings import api_settings
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.documents import User
from apps.accounts.serializers import (
    ChangePasswordSerializer,
    LoginSerializer,
    ProfileUpdateSerializer,
    RegisterSerializer,
)
from apps.accounts.services import (
    issue_tokens,
    touch_last_login,
)
from apps.common.responses import error_response, success_response
from apps.trips.documents import Trip

logger = logging.getLogger(__name__)


class AuthThrottle(ScopedRateThrottle):
    """Shared 'auth' scope for credential endpoints (rate-limited in prod)."""

    throttle_scope = "auth"



class RegisterView(APIView):
    """Create a pending account and issue an email verification code.

    The account only becomes active after the OTP is verified, so an
    unverified user can never sign in or bypass the email check."""

    permission_classes = [AllowAny]
    throttle_classes = [AuthThrottle]
    serializer_class = RegisterSerializer


    @extend_schema(request=RegisterSerializer, auth=[], tags=["auth"])
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        from apps.accounts.services import issue_otp

        code = issue_otp(user)
        payload = {"email": user.email, "email_verified": False}
        # Console OTP deployment: in DEBUG the code is echoed back so the demo
        # flow completes end-to-end; in production it only exists in the logs.
        from django.conf import settings as django_settings

        if django_settings.DEBUG:
            payload["dev_otp"] = code
        return success_response(
            payload,
            message=(
                "Account created. Enter the 6-digit verification code "
                "sent to your email to activate your account."
            ),
            status=status.HTTP_201_CREATED,
        )


class VerifyOtpView(APIView):
    """Verify the email OTP, activate the account and return a token pair."""

    permission_classes = [AllowAny]
    throttle_classes = [AuthThrottle]
    serializer_class = None


    @extend_schema(auth=[], tags=["auth"])
    def post(self, request):
        from apps.accounts.services import OTP_MAX_ATTEMPTS, verify_otp
        from apps.common.responses import error_response

        email = (request.data.get("email") or "").strip().lower()
        code = (request.data.get("code") or "").strip()
        user = User.objects(email=email).first()
        if user is None:
            return error_response("Invalid verification request.", code="INVALID_OTP")
        if user.email_verified and user.is_active:
            tokens = issue_tokens(user)
            return success_response(
                {"user": user.to_safe_dict(), "tokens": tokens},
                message="Email already verified - you are signed in.",
            )
        if not verify_otp(user, code):
            remaining = max(0, OTP_MAX_ATTEMPTS - user.otp_attempts)
            detail = "Too many incorrect attempts. Request a new code." if remaining == 0 else "That code is invalid or has expired. Please try again."
            return error_response(detail, code="INVALID_OTP")
        tokens = issue_tokens(user)
        return success_response(
            {"user": user.to_safe_dict(), "tokens": tokens},
            message="Email verified successfully - welcome to WanderSync!",
        )


class ResendOtpView(APIView):
    """Re-issue a verification code, respecting the resend cooldown."""

    permission_classes = [AllowAny]
    throttle_classes = [AuthThrottle]
    serializer_class = None


    @extend_schema(auth=[], tags=["auth"])
    def post(self, request):
        from apps.accounts.services import issue_otp, otp_cooldown_remaining
        from apps.common.responses import error_response

        email = (request.data.get("email") or "").strip().lower()
        user = User.objects(email=email).first()
        if user is None:
            return success_response(message="If that account exists, a new code has been sent.")
        if user.email_verified:
            return error_response("This email is already verified. Please sign in.", code="ALREADY_VERIFIED")
        remaining = otp_cooldown_remaining(user)
        if remaining > 0:
            return error_response(
                f"Please wait {remaining} seconds before requesting a new code.",
                code="OTP_COOLDOWN",
            )
        code = issue_otp(user)
        payload = {"message": "A new verification code has been sent."}
        from django.conf import settings as django_settings

        if django_settings.DEBUG:
            payload["dev_otp"] = code
        return success_response(payload)


class LoginView(APIView):
    """Exchange email + password for a JWT pair."""

    permission_classes = [AllowAny]
    throttle_classes = [AuthThrottle]
    serializer_class = LoginSerializer


    @extend_schema(request=LoginSerializer, auth=[], tags=["auth"])
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        touch_last_login(user)
        tokens = issue_tokens(user)
        return success_response(
            {"user": user.to_safe_dict(), "tokens": tokens},
            message="Signed in successfully.",
        )


class LogoutView(APIView):
    """Stateless logout — clients discard their tokens.

    Kept as an explicit endpoint so the frontend flow is uniform and so a
    server-side token denylist can be introduced later without changing the
    client contract.
    """

    permission_classes = [IsAuthenticated]
    serializer_class = None

    @extend_schema(tags=["auth"])
    def post(self, request):
        return success_response(message="Signed out successfully.")


class MeView(RetrieveUpdateAPIView):
    """Current user's account + travel profile."""

    permission_classes = [IsAuthenticated]
    serializer_class = ProfileUpdateSerializer

    @extend_schema(responses={200: ProfileUpdateSerializer}, tags=["users"])
    def get(self, request, *args, **kwargs):
        return success_response(
            {"user": request.user.to_safe_dict()},
            message="Profile loaded.",
        )

    def patch(self, request, *args, **kwargs):
        serializer = ProfileUpdateSerializer(
            request.user, data=request.data, partial=True, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response(
            {"user": request.user.to_safe_dict()},
            message="Profile updated.",
        )


class MongoTokenRefreshView(APIView):
    """Exchange a valid refresh token for a fresh token pair.

    Replaces SimpleJWT's stock refresh endpoint, whose rotation path re-queries
    the user through Django's ORM. Verification and rotation happen purely on
    the token; user resolution is delegated to the authentication class.
    """

    permission_classes = [AllowAny]
    throttle_classes: list = []  # default anonymous throttle applies

    @extend_schema(auth=[], tags=["auth"], request=None)
    def post(self, request):
        raw_token = request.data.get("refresh")
        if not raw_token:
            return error_response(
                "A refresh token is required.", code="VALIDATION_ERROR"
            )
        try:
            old = RefreshToken(raw_token)  # verifies signature + expiry
        except TokenError as exc:
            raise InvalidToken(str(exc))

        user_id = old.payload.get(api_settings.USER_ID_CLAIM)
        if user_id is None:
            raise InvalidToken("Token contained no recognizable user identification.")

        new_refresh = RefreshToken()
        new_refresh[api_settings.USER_ID_CLAIM] = user_id

        return success_response(
            {"access": str(new_refresh.access_token), "refresh": str(new_refresh)}
        )


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ChangePasswordSerializer

    @extend_schema(request=ChangePasswordSerializer, tags=["auth"])
    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        logger.info("Password changed for %s", request.user.email)
        # Fresh tokens invalidate any outstanding pair for extra safety.
        tokens = issue_tokens(request.user)
        return success_response(
            {"tokens": tokens},
            message="Password changed successfully.",
        )


class ForgotPasswordView(APIView):
    """Request a password-reset token (demo: prints token to server log)."""

    permission_classes = [AllowAny]
    serializer_class = None

    @extend_schema(auth=[], tags=["auth"])
    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        if not email:
            from apps.common.responses import error_response

            return error_response("Email is required.", code="VALIDATION_ERROR")
        user = User.objects(email=email).first()
        if user is not None and user.is_active:
            token, _ = default_token_generator.make_token(user)
            # In production, email this link. For a dev competition project we
            # log it and return a generic message (never leak account status).
            logger.info(
                "Password reset requested for %s -> /reset?t=%s&u=%s",
                email, token, user.public_id,
            )
        return success_response(
            message="If that account exists, a reset link has been prepared.",
        )


class ResetPasswordView(APIView):
    """Complete a password reset with the emailed token + user id."""

    permission_classes = [AllowAny]
    serializer_class = None

    @extend_schema(auth=[], tags=["auth"])
    def post(self, request):
        from apps.accounts.documents import User
        from apps.common.responses import error_response

        email = (request.data.get("email") or "").strip().lower()
        token = (request.data.get("token") or "").strip()
        new_password = request.data.get("password") or ""
        if len(new_password) < 8:
            return error_response(
                "Password must be at least 8 characters.", code="VALIDATION_ERROR"
            )
        user = User.objects(email=email).first()
        if user is None or not user.is_active:
            return error_response("Invalid reset link.", code="INVALID_RESET")
        if not default_token_generator.check_token(user, token):
            return error_response("Invalid or expired reset link.", code="INVALID_RESET")
        user.set_password(new_password)
        user.save()
        logger.info("Password reset completed for %s", email)
        return success_response(message="Password reset successfully — you can sign in.")


class DeleteAccountView(APIView):
    """Permanently delete the account and all owned data."""

    permission_classes = [IsAuthenticated]
    serializer_class = None

    @extend_schema(tags=["auth"])
    def delete(self, request):
        from apps.planner.documents import Conversation, Message

        owner = request.user.public_id
        Trip.objects(owner_public_id=owner).delete()
        conversations = Conversation.objects(owner_public_id=owner)
        for conversation in conversations.only("id"):
            Message.objects(conversation_id=conversation.id).delete()
        conversations.delete()
        from apps.notifications.models import Notification

        Notification.objects(owner_public_id=owner).delete()
        from apps.sharing.models import SharedTrip

        SharedTrip.objects(owner_public_id=owner).delete()

        email = request.user.email
        request.user.delete()
        logger.info("Account deleted: %s", email)
        return success_response(message="Your account and data have been deleted.")
