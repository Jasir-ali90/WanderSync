from django.urls import path

from apps.exports.views import TripICSView, TripPDFView

urlpatterns = [
    path("trips/<str:trip_id>/pdf/", TripPDFView.as_view(), name="trip-pdf"),
    path("trips/<str:trip_id>/ics/", TripICSView.as_view(), name="trip-ics"),
]