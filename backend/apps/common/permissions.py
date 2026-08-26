"""Reusable DRF permissions."""


from rest_framework.permissions import BasePermission


class IsStaff(BasePermission):
    """Allow only authenticated staff (admin) users."""

    message = "Admin access required."

    def has_permission(self, request, view) -> bool:
        user = getattr(request, "user", None)
        return bool(
            user is not None
            and getattr(user, "is_authenticated", False)
            and getattr(user, "is_staff", False)
        )
