"""Currency conversion for trip cost estimates.

PKR is the base display currency (primary audience: Pakistan). Rates are
fetched live when possible and fall back to a static table; every figure
surfaced to users is labelled as an estimate."""
import logging

from django.conf import settings

logger = logging.getLogger(__name__)

# Units of currency per 1 PKR - PKR is the base display currency.
FALLBACK_RATES_PER_PKR = {
    "PKR": 1.0,
    "USD": 0.0036,
    "AED": 0.0132,
    "SAR": 0.0135,
    "EUR": 0.0033,
    "GBP": 0.0029,
    "INR": 0.30,
    "JPY": 0.55,
    "CNY": 0.026,
    "CAD": 0.0049,
    "AUD": 0.0054,
    "MYR": 0.0169,
    "TRY": 0.12,
}

_RATE_CACHE = {"rates": None}


def _fetch_live_rates():
    if _RATE_CACHE["rates"] is not None:
        return _RATE_CACHE["rates"]
    try:
        import requests

        response = requests.get("https://open.er-api.com/v6/latest/USD", timeout=settings.CURRENCY_API_TIMEOUT_SECONDS)
        usd_rates = (response.json() or {}).get("rates") or {}
        if usd_rates.get("PKR"):
            pkr = usd_rates["PKR"]
            # Normalize live rates to "per 1 PKR" so PKR remains the base.
            rates = {code: (rate / pkr) for code, rate in usd_rates.items()}
            rates["PKR"] = 1.0
            _RATE_CACHE["rates"] = rates
            return rates
    except Exception as exc:
        logger.info("Live exchange rates unavailable, using fallback: %s", exc)
    _RATE_CACHE["rates"] = FALLBACK_RATES_PER_PKR
    return _RATE_CACHE["rates"]


def convert(amount, from_currency: str = "PKR", to_currency: str = "PKR") -> float:
    """Convert an amount between two ISO currencies via PKR base."""
    from_currency = (from_currency or "PKR").upper()
    to_currency = (to_currency or "PKR").upper()
    amount = float(amount or 0)
    if from_currency == to_currency:
        return round(amount, 2)
    rates = _fetch_live_rates()
    from_rate = rates.get(from_currency) or FALLBACK_RATES_PER_PKR.get(from_currency)
    to_rate = rates.get(to_currency) or FALLBACK_RATES_PER_PKR.get(to_currency)
    if not from_rate or not to_rate:
        logger.warning("Unsupported currency pair %s -> %s", from_currency, to_currency)
        return round(amount, 2)
    return round(amount * to_rate / from_rate, 2)
