"""Central HTTP helper for external providers.

All outbound calls go through ``fetch_json`` so timeouts are enforced,
failures fail SOFT (return None), and tests can patch one function.
"""
import logging

import requests

logger = logging.getLogger(__name__)

DEFAULT_TIMEOUT = 12


def fetch_json(url, params=None, headers=None, timeout: int = DEFAULT_TIMEOUT):
    """GET a JSON document. Returns None on any network/parse failure."""
    try:
        response = requests.get(
            url,
            params=params or {},
            headers=headers or {},
            timeout=timeout,
        )
        if response.status_code != 200:
            logger.info("Provider %s returned HTTP %s", url.split("/")[2] if "//" in url else url, response.status_code)
            return None
        return response.json()
    except Exception as exc:
        logger.warning("Provider request failed (%s): %s", url, exc.__class__.__name__)
        return None
