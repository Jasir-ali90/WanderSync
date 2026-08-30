"""Account business logic — kept out of views/serializers."""
import logging

import secrets
from datetime import timedelta, timezone as datetime_timezone

from django.contrib.auth.hashers import check_password, make_password
from django.utils import timezone
from mongoengine import DoesNotExist  # noqa: F401  (re-exported for callers)

from apps.accounts.documents import User

logger = logging.getLogger(__name__)



class AccountError(Exception):
    """Domain-level account error with a user-safe message."""

    def __init__(self, message: str, code: str = "ACCOUNT_ERROR"):
        super().__init__(message)
        self.message = message
        self.code = code


class EmailAlreadyExistsError(AccountError):
    def __init__(self):
        super().__init__(
            "An account with this email already exists.",
            code="EMAIL_EXISTS",
        )


def normalize_email(email: str) -> str:
    return (email or "").strip().lower()


def create_user(*, email: str, password: str, full_name: str = "") -> User:
    """Create an active, verified account with a securely hashed password."""
    email = normalize_email(email)
    if not email:
        raise AccountError("Email is required.", code="VALIDATION_ERROR")
    if User.objects(email=email).first():
        raise EmailAlreadyExistsError()

    user = User(
        email=email,
        full_name=(full_name or "").strip()[:120],
        is_active=True,
        email_verified=True,
    )
    user.set_password(password)
    user.save()
    logger.info("User registered: %s", email)
    return user


def authenticate_user(*, email: str, password: str) -> User | None:
    """Return the active user when credentials match, else ``None``."""
    email = normalize_email(email)
    user = User.objects(email=email).first()
    if user is None or not user.is_active:
        # Do not reveal whether the email exists.
        return None
    if not user.check_password(password):
        return None
    return user


def issue_tokens(user: User) -> dict:
    """Create a fresh access/refresh token pair for ``user``."""
    from rest_framework_simplejwt.tokens import RefreshToken

    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


def touch_last_login(user: User) -> None:
    from django.utils import timezone

    user.modify(last_login=timezone.now())


def get_user_by_public_id(public_id: str) -> User | None:
    return User.objects(public_id=str(public_id)).first()

# -- email OTP verification ----------------------------------------------
OTP_LENGTH = 6
OTP_TTL_MINUTES = 10
OTP_MAX_ATTEMPTS = 5
OTP_RESEND_COOLDOWN_SECONDS = 60


def validate_full_name(name: str) -> str:
    '''Names may only contain letters, spaces and simple punctuation.'''
    cleaned = (name or "").strip()
    allowed = "-."
    if cleaned and not all(ch.isalpha() or ch.isspace() or ch in allowed for ch in cleaned):
        raise AccountError(
            "Name can only contain letters, spaces, hyphens and apostrophes.",
            code="INVALID_NAME",
        )
    return cleaned[:120]


def issue_otp(user: User) -> str:
    '''Generate a cryptographically secure 6-digit code (hashed at rest).'''
    code = str(secrets.randbelow(10 ** OTP_LENGTH)).zfill(OTP_LENGTH)
    now = timezone.now()
    user.modify(
        otp_hash=make_password(code),
        otp_expires_at=now + timedelta(minutes=OTP_TTL_MINUTES),
        otp_attempts=0,
        otp_last_sent_at=now,
    )
    # Console delivery for this deployment: the code only ever appears in
    # the server log, never in an API response or the frontend.
    logger.info("WANDERSYNC OTP for %s: %s", user.email, code)
    return code


def _as_aware(value):
    '''MongoDB stores naive UTC datetimes; Django's now() is aware. Normalise
    so comparisons never raise "naive vs aware" TypeErrors.'''
    if value is None:
        return None
    if timezone.is_naive(value):
        return timezone.make_aware(value, datetime_timezone.utc)
    return value


def otp_cooldown_remaining(user: User) -> int:
    last_sent = _as_aware(user.otp_last_sent_at)
    if not last_sent:
        return 0
    elapsed = (timezone.now() - last_sent).total_seconds()
    return max(0, int(OTP_RESEND_COOLDOWN_SECONDS - elapsed))


def verify_otp(user: User, code: str) -> bool:
    '''Check the code, enforce expiry and attempts, then activate the account.'''
    code = (code or "").strip()
    if not code or not user.otp_hash:
        return False
    if user.otp_attempts >= OTP_MAX_ATTEMPTS:
        return False
    expires_at = _as_aware(user.otp_expires_at)
    if not expires_at or timezone.now() > expires_at:
        return False
    user.modify(otp_attempts=user.otp_attempts + 1)
    if not check_password(code, user.otp_hash):
        return False
    user.modify(
        otp_hash="",
        otp_expires_at=None,
        otp_attempts=0,
        email_verified=True,
        is_active=True,
    )
    return True

