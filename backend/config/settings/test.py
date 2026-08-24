"""Test settings — isolated database and relaxed throttling.

Run tests with:
    python manage.py test --settings=config.settings.test
"""
from .dev import *  # noqa: F401,F403

# Isolated database so test runs never touch development data.
MONGODB_DB = "wandersync_test"

# Throttling must stay functional for per-view scoped throttles, so rates are
# raised to generous values rather than removed.
REST_FRAMEWORK = dict(REST_FRAMEWORK)  # noqa: F405
REST_FRAMEWORK["DEFAULT_THROTTLE_CLASSES"] = ()
REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"] = {
    "anon": "10000/min",
    "user": "10000/min",
    "auth": "1000/min",
    "ai": "1000/min",
    "export": "1000/min",
}


# Faster, deterministic password hashing in the test suite.
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]
