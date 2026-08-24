"""Pagination that keeps the standard response envelope intact."""
import math

from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class EnvelopePagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response(
            {
                "success": True,
                "message": "Request completed successfully",
                "data": {
                    "count": self.page.paginator.count,
                    "page": self.page.number,
                    "pages": self.page.paginator.num_pages,
                    "results": data,
                },
            }
        )


def paginate_mongo_queryset(queryset, request, default_size: int = 20) -> dict:
    """Offset pagination for MongoEngine querysets.

    Returns ``{"count", "page", "pages", "results"}``; callers serialize
    ``results`` and pass the dict as envelope ``data``.
    """
    try:
        page = max(1, int(request.query_params.get("page", 1)))
    except (TypeError, ValueError):
        page = 1
    try:
        size = min(100, max(1, int(request.query_params.get("page_size", default_size))))
    except (TypeError, ValueError):
        size = default_size

    total = queryset.count()
    offset = (page - 1) * size
    items = list(queryset.skip(offset).limit(size))
    return {
        "count": total,
        "page": page,
        "pages": max(1, math.ceil(total / size)) if total else 0,
        "results": items,
        "_page_meta": {"offset": offset, "size": size},
    }

