"""Personalized travel recommendations.

Rules-based (transparent, no fabricated claims):
- Gather the user's interests from their profile + past trips.
- Map interests to Famous Spots categories; surface matching spots.
- Recommend popular destinations the user has NOT yet visited.
"""
import logging

from apps.accounts.documents import User
from apps.common.responses import success_response
from apps.travel.spot_data import SPOT_COUNTRIES
from apps.trips.documents import Trip
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

logger = logging.getLogger(__name__)

# interest keyword -> spot name/country keywords
_INTEREST_SPOT_MAP = [
    ("museum", ("museum", "louvre", "hagia", "gallery")),
    ("history", ("colosseum", "pyramids", "luxor", "versailles", "hagia")),
    ("food", ("market", "bologna", "street food")),
    ("beach", ("beach", "red sea", "riviera")),
    ("nature", ("fuji", "terraces", "matterhorn", "jungfrau", "cappadocia")),
    ("hiking", ("fuji", "jungfrau", "balloon")),
    ("art", ("louvre", "museum", "gallery")),
    ("shopping", ("dubai", "malaysia")),
    ("adventure", ("desert", "safari", "cappadocia")),
    ("photography", ("balloon", "torii", "sky bridge")),
]


def _user_interests(user) -> list[str]:
    interests = list((user.profile.interests or []) if user.profile else [])
    for trip in Trip.objects(owner_public_id=user.public_id).only("interests"):
        interests.extend(trip.interests or [])
    return list(dict.fromkeys(interests))


def _recommend_spots(user) -> list[dict]:
    interests = _user_interests(user)
    haystack = " ".join(interest.lower() for interest in interests)
    suggestions: list[dict] = []
    seen: set[str] = set()

    for country in SPOT_COUNTRIES:
        for spot in country["spots"]:
            reasons: list[str] = []
            key = f"{country['country']}:{spot['name']}"
            if key in seen:
                continue
            for interest, keywords in _INTEREST_SPOT_MAP:
                if interest in haystack:
                    if any(kw in f"{spot['name']} {spot['description']}".lower() for kw in keywords):
                        reasons.append(f"you're into {interest}")
            if reasons:
                seen.add(key)
                suggestions.append(
                    {
                        "country": country["country"],
                        "country_code": country["code"],
                        "spot": spot,
                        "reason": "Recommended because " + ", ".join(reasons[:2]) + ".",
                    }
                )
    return suggestions[:6]


def _recommend_destinations(user) -> list[dict]:
    visited = {
        t.destination.strip().lower()
        for t in Trip.objects(owner_public_id=user.public_id).only("destination")
        if t.destination
    }
    out = []
    for country in SPOT_COUNTRIES:
        if country["country"].lower() not in visited and len(out) < 4:
            out.append(
                {
                    "country": country["country"],
                    "code": country["code"],
                    "tagline": country["tagline"],
                    "reason": "A popular destination you haven't planned yet.",
                }
            )
    return out


class RecommendationsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        interests = _user_interests(user)
        return success_response(
            {
                "interests": interests,
                "spots": _recommend_spots(user),
                "destinations": _recommend_destinations(user),
            }
        )