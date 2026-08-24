"""Account business logic — kept out of views/serializers."""
import logging

from django.contrib.auth.hashers import make_password
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
    """Create an active user with a hashed password. Raises on duplicates."""
    email = normalize_email(email)
    if not email:
        raise AccountError("Email is required.", code="VALIDATION_ERROR")
    if User.objects(email=email).first():
        raise EmailAlreadyExistsError()

    user = User(
        email=email,
        full_name=(full_name or "").strip()[:120],
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

