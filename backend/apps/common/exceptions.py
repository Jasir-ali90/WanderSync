"""Centralised API error handling.

Guarantees the standard error envelope, maps DRF/Django errors to stable
machine-readable codes, and never leaks tracebacks or internals to clients.
"""
import logging

from django.core.exceptions import PermissionDenied
from django.http import Http404
from rest_framework import exceptions as drf_exceptions
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

logger = logging.getLogger(__name__)

_STATUS_TO_CODE = {
    400: "VALIDATION_ERROR",
    401: "UNAUTHENTICATED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    405: "METHOD_NOT_ALLOWED",
    409: "CONFLICT",
    429: "RATE_LIMITED",
    500: "INTERNAL_ERROR",
    503: "SERVICE_UNAVAILABLE",
}


def _error_response(status_code, message, code=None, details=None):
    return Response(
        {
            "success": False,
            "message": message,
            "error": {
                "code": code or _STATUS_TO_CODE.get(status_code, "ERROR"),
                "details": details if details is not None else [],
            },
        },
        status=status_code,
    )


def wandersync_exception_handler(exc, context):
    """Envelope all errors with friendly messages; log unexpected ones."""
    response = drf_exception_handler(exc, context)

    # Wrong credentials arrive as a serializer ValidationError; promote them to
    # 401 so clients can distinguish auth failures from payload mistakes.
    if isinstance(exc, drf_exceptions.ValidationError):
        try:
            codes = exc.get_codes()
        except AttributeError:  # pragma: no cover - defensive
            codes = None
        flat = set()
        if isinstance(codes, dict):
            for value in codes.values():
                if isinstance(value, (list, tuple)):
                    flat.update(str(item) for item in value)
                elif isinstance(value, dict):
                    flat.update(str(item) for items in value.values() for item in (items if isinstance(items, (list, tuple)) else [items]))
                else:
                    flat.add(str(value))
        elif isinstance(codes, (list, tuple)):
            flat.update(str(item) for item in codes)
        else:
            flat.add(str(codes))
        if "invalid_credentials" in flat:
            return _error_response(401, "Incorrect email or password.")

    # Throttled requests get a friendly, actionable message.
    if isinstance(exc, drf_exceptions.Throttled):
        wait = getattr(exc, "wait", None)
        message = (
            f"Too many requests. Please try again in {int(wait)} seconds."
            if wait
            else "Too many requests. Please slow down and try again shortly."
        )
        return _error_response(429, message)

    if response is None:
        if isinstance(exc, Http404):
            return _error_response(404, "The requested resource was not found.")
        if isinstance(exc, PermissionDenied):
            return _error_response(403, "You do not have permission to do that.")
        logger.exception("Unhandled exception at %s", context.get("view"))
        return _error_response(500, "Something went wrong on our side. Please try again.")

    detail = response.data
    details = []
    if isinstance(detail, dict):
        for field, messages in detail.items():
            def _flatten(values, prefix=None):
                out = []
                if isinstance(values, dict):
                    for key, value in values.items():
                        out.extend(_flatten(value, prefix=key if prefix is None else f"{prefix}.{key}"))
                elif isinstance(values, (list, tuple)):
                    for value in values:
                        out.extend(_flatten(value, prefix=prefix))
                else:
                    out.append({"field": prefix or str(field), "message": str(values)})
                return out

            details.extend(_flatten(messages))
        message = (
            "Please review the highlighted fields and try again."
            if response.status_code == 400
            else str(detail.get("detail", "Unable to complete request"))
        )
    else:
        message = str(detail)
        details = [{"field": None, "message": str(detail)}]

    friendly = {
        401: "Your session is invalid or has expired. Please sign in again.",
        403: "You do not have permission to perform this action.",
        404: "The requested resource was not found.",
        405: "This action is not supported.",
    }.get(response.status_code, message)

    logger.info(
        "API error %s at %s: %s",
        response.status_code,
        context.get("request").path if context.get("request") else "-",
        exc.__class__.__name__,
    )
    return _error_response(response.status_code, friendly, details=details)
