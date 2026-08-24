"""ASGI config for WanderSync.

Use this entry point in production if real-time features (Django Channels /
WebSockets) are enabled; otherwise the WSGI entry point is sufficient.
"""
import os

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")

application = get_asgi_application()
