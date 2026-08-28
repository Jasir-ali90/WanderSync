"""MongoDB connection management.

A single MongoClient is created lazily and reused process-wide. Connection is
intentionally lazy so management commands (and the health check) can run even
when MongoDB is temporarily unreachable.
"""
import logging

from django.conf import settings
from mongoengine import connect, get_connection

import certifi

logger = logging.getLogger(__name__)

ALIAS = "default"


def ensure_connection():
    """Ensure a MongoEngine connection exists; return True when reachable."""
    try:
        client = get_connection(ALIAS)
    except Exception:
        client = None
    if client is not None:
        return _ping(client)
    try:
        connect(
            db=settings.MONGODB_DB,
            host=settings.MONGODB_URI,
            alias=ALIAS,
            serverSelectionTimeoutMS=settings.MONGODB_CONNECT_TIMEOUT_MS,
            uuidRepresentation="standard",
            tlsCAFile=certifi.where(),
            tlsDisableOCSPEndpointCheck=True,
        )

        client = get_connection(ALIAS)
        return _ping(client)
    except Exception as exc:  # pragma: no cover - environment specific
        logger.warning("MongoDB connection failed: %s", exc)
        return False


def _ping(client) -> bool:
    try:
        client.admin.command("ping")
        return True
    except Exception as exc:
        logger.warning("MongoDB ping failed: %s", exc)
        return False
