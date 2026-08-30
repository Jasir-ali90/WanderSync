"""Base settings shared by all environments.

Environment-specific values are read from environment variables (optionally
loaded from a local .env file). Secrets must NEVER be committed to source
control — see .env.example at the repository root.
"""
import datetime
import os
from pathlib import Path

from dotenv import load_dotenv

# ------------------------------------------------------------------
# Paths & environment loading
# ------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent.parent

load_dotenv(BASE_DIR / ".env")


def env(key, default=None):
    """Read an environment variable with an optional default."""
    return os.environ.get(key, default)


def env_bool(key: str, default: bool = False) -> bool:
    return os.environ.get(key, str(default)).strip().lower() in {
        "1", "true", "yes", "on",
    }


def env_int(key: str, default: int) -> int:
    try:
        return int(os.environ.get(key, default))
    except (TypeError, ValueError):
        return default


def env_list(key: str, default: str = "") -> list:
    raw = os.environ.get(key, default)
    return [item.strip() for item in raw.split(",") if item.strip()]


# ------------------------------------------------------------------
# Core Django configuration
# ------------------------------------------------------------------
SECRET_KEY = env(
    "DJANGO_SECRET_KEY",
    "django-insecure-DEV-ONLY-change-me-in-production",
)

DEBUG = False  # overridden per environment

ALLOWED_HOSTS = env_list("ALLOWED_HOSTS", "localhost,127.0.0.1,[::1]")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Project apps
    "apps.accounts",
    "apps.trips",
    "apps.planner",
    "apps.travel",
    "apps.itineraries",
    "apps.sharing",
    "apps.exports",
    "apps.notifications",
    "apps.analytics",
    "apps.recommendations",



    # Third-party
    "rest_framework",
    "corsheaders",
    "drf_spectacular",
]


MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

# MongoDB is the primary datastore; Django's relational layer is unused.
DATABASES = {}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
    {"NAME": "apps.accounts.password_validation.ComplexityValidator"}
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = env("TIME_ZONE", "UTC")
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ------------------------------------------------------------------
# Django REST Framework
# ------------------------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "apps.accounts.authentication.MongoJWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_RENDERER_CLASSES": (
        "apps.common.renderers.EnvelopeRenderer",
        "rest_framework.renderers.JSONRenderer",
    ),
    "EXCEPTION_HANDLER": "apps.common.exceptions.wandersync_exception_handler",
    "DEFAULT_PAGINATION_CLASS": "apps.common.pagination.EnvelopePagination",
    "PAGE_SIZE": 20,
    "DEFAULT_THROTTLE_CLASSES": (
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ),
    "DEFAULT_THROTTLE_RATES": {
        "anon": env("THROTTLE_ANON_RATE", "60/min"),
        "user": env("THROTTLE_USER_RATE", "120/min"),
        # Expensive operations get dedicated scopes (applied per-view).
        "ai": env("THROTTLE_AI_RATE", "10/min"),
        "auth": env("THROTTLE_AUTH_RATE", "20/min"),
        "export": env("THROTTLE_EXPORT_RATE", "5/min"),
    },
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}

SPECTACULAR_SETTINGS = {
    "TITLE": "WanderSync API",
    "DESCRIPTION": "AI-powered travel itinerary planning platform.",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
}

# ------------------------------------------------------------------
# JWT authentication
# ------------------------------------------------------------------
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": datetime.timedelta(
        minutes=env_int("JWT_ACCESS_MINUTES", 30)
    ),
    "REFRESH_TOKEN_LIFETIME": datetime.timedelta(
        days=env_int("JWT_REFRESH_DAYS", 7)
    ),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": False,
    "ALGORITHM": "HS256",
    "SIGNING_KEY": env("JWT_SECRET", SECRET_KEY),
    "AUTH_HEADER_TYPES": ("Bearer",),
    # JWTs carry the MongoEngine user's public UUID — never the raw ObjectId.
    "USER_ID_FIELD": "public_id",
    "USER_ID_CLAIM": "user_id",
}

# ------------------------------------------------------------------
# Testing
# ------------------------------------------------------------------
# MongoDB is not managed by Django's test DB machinery; this runner skips
# relational database setup/teardown entirely.
TEST_RUNNER = "config.test_runner.NoDatabaseRunner"


# ------------------------------------------------------------------
# CORS / CSRF
# ------------------------------------------------------------------
CORS_ALLOWED_ORIGINS = env_list(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,https://wander-sync-psi.vercel.app",
)
CSRF_TRUSTED_ORIGINS = env_list(
    "CSRF_TRUSTED_ORIGINS",
    "http://localhost:5173,http://localhost:8000,http://127.0.0.1:8000,https://wander-sync-psi.vercel.app",
)

# ------------------------------------------------------------------
# MongoDB (primary datastore)
# ------------------------------------------------------------------
MONGODB_URI = env("MONGODB_URI", "mongodb://localhost:27017/wandersync")
MONGODB_DB = env("MONGODB_DB", "wandersync")
# Generous default: a remote Atlas handshake can take several seconds on slow
# links; bumping from the previous 3s reduces flaky "SSL handshake failed" on
# otherwise-fine connections. Tune in .env if needed.
MONGODB_CONNECT_TIMEOUT_MS = env_int("MONGODB_CONNECT_TIMEOUT_MS", 10000)

# ------------------------------------------------------------------
# External integrations (server-side only — never exposed to the client)
# ------------------------------------------------------------------
OPENAI_API_KEY = env("OPENAI_API_KEY", "")
OPENAI_MODEL = env("OPENAI_MODEL", "llama-3.3-70b-versatile")
# Optional: any OpenAI-compatible endpoint (Groq, OpenRouter, Together,
# DeepSeek, Ollama...). Example: https://api.groq.com/openai/v1
OPENAI_BASE_URL = env("OPENAI_BASE_URL", "")

MAPS_API_KEY = env("MAPS_API_KEY", "")
WEATHER_API_KEY = env("WEATHER_API_KEY", "")

CLIENT_URL = env("CLIENT_URL", "http://localhost:5173")

# ------------------------------------------------------------------
# Email delivery
# ------------------------------------------------------------------
EMAIL_BACKEND = env(
    "EMAIL_BACKEND",
    "django.core.mail.backends.console.EmailBackend",
)

CACHE_TTL_SECONDS = env_int("CACHE_TTL_SECONDS", 900)
CURRENCY_API_TIMEOUT_SECONDS = env_int("CURRENCY_API_TIMEOUT_SECONDS", 4)

# ------------------------------------------------------------------
# Security headers
# ------------------------------------------------------------------
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
SECURE_REFERRER_POLICY = "same-origin"

if not DEBUG:
    SECURE_SSL_REDIRECT = env_bool("SECURE_SSL_REDIRECT")
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
