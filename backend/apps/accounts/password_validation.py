"""Additional password complexity rule for WanderSync accounts."""
import re

from django.core.exceptions import ValidationError


class ComplexityValidator:
    """Require upper, lower, digit and special characters."""

    def validate(self, password, user=None):
        if not (
            re.search(r"[A-Z]", password)
            and re.search(r"[a-z]", password)
            and re.search(r"[0-9]", password)
            and re.search(r"[^A-Za-z0-9]", password)
        ):
            raise ValidationError(
                "Password must include uppercase and lowercase letters, a number and a special character.",
                code="password_weak",
            )

    def get_help_text(self):
        return "Your password must contain upper and lower case letters, a number and a special character."
