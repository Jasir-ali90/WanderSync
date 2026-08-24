"""Open-Meteo weather provider — keyless LIVE data."""
from integrations.http import fetch_json
from integrations.providers.base import TravelProvider

BASE_URL = "https://api.open-meteo.com/v1/forecast"

# WMO weather interpretation codes -> (label, emoji)
WMO_CODES = {
    0: ("Clear sky", "☀️"),
    1: ("Mainly clear", "🌤️"),
    2: ("Partly cloudy", "⛅"),
    3: ("Overcast", "☁️"),
    45: ("Fog", "🌫️"),
    48: ("Depositing rime fog", "🌫️"),
    51: ("Light drizzle", "🌦️"),
    53: ("Moderate drizzle", "🌦️"),
    55: ("Dense drizzle", "🌧️"),
    61: ("Slight rain", "🌧️"),
    63: ("Moderate rain", "🌧️"),
    65: ("Heavy rain", "⛈️"),
    71: ("Slight snowfall", "🌨️"),
    73: ("Moderate snowfall", "🌨️"),
    75: ("Heavy snowfall", "❄️"),
    80: ("Rain showers", "🌦️"),
    81: ("Moderate rain showers", "🌧️"),
    82: ("Violent rain showers", "⛈️"),
    95: ("Thunderstorm", "⛈️"),
    96: ("Thunderstorm with hail", "⛈️"),
    99: ("Severe thunderstorm with hail", "🌩️"),
}


def describe_wmo(code) -> tuple[str, str]:
    label, icon = WMO_CODES.get(int(code), ("Unknown conditions", "🌡️")) if code is not None else ("Unknown conditions", "🌡️")
    return label, icon


class OpenMeteoWeatherProvider(TravelProvider):
    name = "open-meteo"

    def get_weather(self, lat: float, lon: float, days: int = 3) -> dict | None:
        days = max(1, min(days, 7))
        data = fetch_json(
            BASE_URL,
            params={
                "latitude": lat,
                "longitude": lon,
                "current_weather": "true",
                "daily": "temperature_2m_max,temperature_2m_min,"
                         "precipitation_sum,windspeed_10m_max,weathercode",
                "timezone": "auto",
                "forecast_days": days,
            },
        )
        if not isinstance(data, dict) or "current_weather" not in data:
            return None

        current = data["current_weather"]
        code = current.get("weathercode")
        condition, icon = describe_wmo(code)

        daily = data.get("daily", {}) or {}
        forecast_days = []
        dates = daily.get("time", []) or []
        for index, day_date in enumerate(dates):
            day_code = daily.get("weathercode", [])[index] if index < len(daily.get("weathercode", [])) else None
            label, day_icon = describe_wmo(day_code)
            forecast_days.append(
                {
                    "date": day_date,
                    "temp_max_c": daily.get("temperature_2m_max", [None] * len(dates))[index],
                    "temp_min_c": daily.get("temperature_2m_min", [None] * len(dates))[index],
                    "precipitation_mm": daily.get("precipitation_sum", [None] * len(dates))[index],
                    "wind_kmh": daily.get("windspeed_10m_max", [None] * len(dates))[index],
                    "condition": label,
                    "icon": day_icon,
                }
            )

        return {
            "location": {"lat": lat, "lon": lon},
            "current": {
                "temperature_c": current.get("temperature"),
                "wind_kmh": current.get("windspeed"),
                "condition": condition,
                "icon": icon,
                "is_day": bool(current.get("is_day", 1)),
            },
            "forecast": forecast_days,
        }

    # Places/hotels/events are not this provider's job.
    def search_places(self, query: str, limit: int = 5):
        return None

    def get_place_details(self, place_id: str):
        return None

    def search_hotels(self, city: str, limit: int = 5):
        return None

    def get_events(self, city: str, start=None, end=None, limit: int = 5):
        return None
