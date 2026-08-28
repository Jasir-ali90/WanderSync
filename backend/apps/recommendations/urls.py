"""URL routes for recommendations."""
from django.urls import path

from apps.recommendations.service import RecommendationsView

urlpatterns = [
    path("", RecommendationsView.as_view(), name="recommendations"),
]