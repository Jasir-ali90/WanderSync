"""Accounts app configuration."""
from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.accounts"
    verbose_name = "Accounts"

    def ready(self):
        # Establish the MongoDB connection when the process boots so every
        # request path (and the test suite) has a usable connection.
        from config.db import ensure_connection

        ensure_connection()
