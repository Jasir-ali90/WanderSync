"""Renderer that wraps successful DRF responses in the standard envelope.

Error responses are already enveloped by the custom exception handler; this
renderer only reshapes 2xx payloads that have not been enveloped manually.
"""
from rest_framework.renderers import JSONRenderer


class EnvelopeRenderer(JSONRenderer):
    def render(self, data, accepted_media_type=None, renderer_context=None):
        response = renderer_context.get("response") if renderer_context else None
        # Pass through anything the exception handler or a view already enveloped.
        if isinstance(data, dict) and "success" in data:
            return super().render(data, accepted_media_type, renderer_context)
        if response is not None and 200 <= response.status_code < 300:
            enveloped = {
                "success": True,
                "message": "Request completed successfully",
                "data": data,
            }
            return super().render(enveloped, accepted_media_type, renderer_context)
        return super().render(data, accepted_media_type, renderer_context)
