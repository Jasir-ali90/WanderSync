"""Shared helpers for building the standard API envelope."""
from rest_framework.response import Response


def success_response(data=None, message="Request completed successfully", status=200):
    return Response(
        {"success": True, "message": message, "data": data if data is not None else {}},
        status=status,
    )


def error_response(message, code="ERROR", details=None, status=400):
    return Response(
        {
            "success": False,
            "message": message,
            "error": {
                "code": code,
                "details": details if details is not None else [],
            },
        },
        status=status,
    )
