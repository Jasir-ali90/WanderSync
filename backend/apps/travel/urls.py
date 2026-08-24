"""URL routes for travel data (/api/v1/...)."""
from django.urls import path

from apps.travel.views import (
    EventsView,
    HotelSearchView,
    PlaceDetailView,
    PlaceSearchView,
    WeatherView,
)

urlpatterns = [
    path("places/search/", PlaceSearchView.as_view(), name="place-search"),
    path("places/<str:place_id>/", PlaceDetailView.as_view(), name="place-detail"),
    path("weather/", WeatherView.as_view(), name="weather"),
    path("hotels/", HotelSearchView.as_view(), name="hotel-search"),
    path("events/", EventsView.as_view(), name="events"),
]
