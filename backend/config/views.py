from django.conf import settings
from django.http import HttpResponse


def spa(request, path=""):
    """Serve the built React SPA in production (single-container deploys).

    In development the Vite dev server handles the frontend; this view is a
    convenience for production deployments where the backend serves statics.
    """
    candidate = getattr(settings, "BASE_DIR", None)
    if candidate:
        index = candidate / "staticfiles" / "index.html"
        if index.exists():
            with open(index, "rb") as fh:
                return HttpResponse(fh.read(), content_type="text/html")
    return HttpResponse("WanderSync API is running.", content_type="text/plain")
