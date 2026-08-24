"""Development settings."""
from .base import *  # noqa: F401,F403
from .base import env, env_bool

DEBUG = env_bool("DJANGO_DEBUG", True)

# 'testserver' lets management-script smoke tests use Django's test client.
ALLOWED_HOSTS = [*ALLOWED_HOSTS, "testserver"]

# Relax TLS-related headers in local development.
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

