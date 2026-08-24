"""WSGI config for WanderSync.

Exposes the WSGI callable as a module-level variable named ``application``.
Use this with Gunicorn/Waitress in production when no WebSockets are needed.
"""
import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")

application = get_wsgi_application()
