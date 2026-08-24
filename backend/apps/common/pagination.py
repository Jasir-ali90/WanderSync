"""Pagination that keeps the standard response envelope intact."""
from collections import OrderedDict

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
                "data": OrderedDict(
                    [
                        ("count", self.page.paginator.count),
                        ("page", self.page.number),
                        ("pages", self.page.paginator.num_pages),
                        ("results", data),
                    ]
                ),
            }
        )
