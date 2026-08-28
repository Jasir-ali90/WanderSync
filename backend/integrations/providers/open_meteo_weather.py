"""Open-Meteo weather provider — keyless LIVE data."""
from datetime import date

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

    def get_weather(self, lat: float, lon: float, days: int = 3, start=None) -> dict | None:
        """Current conditions + forecast.

        ``start`` is an optional ``date`` the traveller arrives; when given,
        the forecast window begins as close to that date as possible
        (Open-Meteo serves up to 16 days ahead).
        """
        days = max(1, min(days, 7))
        params = {
            "latitude": lat,
            "longitude": lon,
            "current": "temperature_2m,apparent_temperature,relative_humidity_2m,"
                       "is_day,precipitation,weather_code,wind_speed_10m",
            "hourly": "temperature_2m,precipitation_probability",
            "daily": "temperature_2m_max,temperature_2m_min,"
                     "precipitation_sum,precipitation_probability_max,"
                     "windspeed_10m_max,weathercode,sunrise,sunset,"
                     "uv_index_max",
            "timezone": "auto",
            "forecast_days": 16 if start is not None else days,
        }
        data = fetch_json(BASE_URL, params=params)
        if not isinstance(data, dict) or "current" not in data:
            # Older payload shape fallback (current_weather only).
            if not isinstance(data, dict) or "current_weather" not in data:
                return None

        current_block = data.get("current") or {}
        legacy = data.get("current_weather") or {}
        code = current_block.get("weather_code", legacy.get("weathercode"))
        condition, icon = describe_wmo(code)

        def _num(key_current: str, key_legacy: str):
            value = current_block.get(key_current, legacy.get(key_legacy))
            return value if isinstance(value, (int, float)) else None

        daily = data.get("daily", {}) or {}
        forecast_days = []
        dates = daily.get("time", []) or []

        # Slice the raw forecast to requested days, aligned with an optional
        # arrival date so users see the weather for when they will be there.
        first_index = 0
        if start is not None:
            for idx, day_date in enumerate(dates):
                if day_date >= start.isoformat():
                    first_index = idx
                    break
            else:
                first_index = len(dates)  # arrival beyond the forecast horizon
        window = dates[first_index:first_index + days]

        for index_offset, day_date in enumerate(window):
            index = first_index + index_offset

            def _daily(key: str):
                values = daily.get(key, [])
                return values[index] if index < len(values) else None

            day_code = _daily("weathercode")
            label, day_icon = describe_wmo(day_code)
            forecast_days.append(
                {
                    "date": day_date,
                    "temp_max_c": _daily("temperature_2m_max"),
                    "temp_min_c": _daily("temperature_2m_min"),
                    "precipitation_mm": _daily("precipitation_sum"),
                    "precipitation_chance_pct": _daily("precipitation_probability_max"),
                    "wind_kmh": _daily("windspeed_10m_max"),
                    "uv_index_max": _daily("uv_index_max"),
                    "sunrise": _daily("sunrise"),
                    "sunset": _daily("sunset"),
                    "condition": label,
                    "icon": day_icon,
                }
            )

        return {
            "location": {"lat": lat, "lon": lon},
            "current": {
                "temperature_c": _num("temperature_2m", "temperature"),
                "feels_like_c": _num("apparent_temperature", ""),
                "humidity_pct": current_block.get("relative_humidity_2m"),
                "wind_kmh": _num("wind_speed_10m", "windspeed"),
                "precipitation_mm": current_block.get("precipitation"),
                "condition": condition,
                "icon": icon,
                "is_day": bool(current_block.get("is_day", legacy.get("is_day", 1))),
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
