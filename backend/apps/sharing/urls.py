"""URL routes for sharing."""
from django.urls import path

from apps.sharing.views import ShareLinkView, SharedTripView

urlpatterns = [
    path("trips/<str:trip_id>/", ShareLinkView.as_view(), name="share-link"),
    path("<str:token>/", SharedTripView.as_view(), name="shared-trip"),
]
