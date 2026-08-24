"""Thread-safe in-process TTL cache for provider responses."""
import threading
import time

_lock = threading.RLock()
_store: dict[str, tuple[float, object]] = {}


def cache_get(key: str):
    """Return ``(value, True)`` on a fresh hit, ``(None, False)`` otherwise."""
    with _lock:
        entry = _store.get(key)
        if entry is None:
            return None, False
        expires_at, value = entry
        if time.monotonic() > expires_at:
            _store.pop(key, None)
            return None, False
        return value, True


def cache_set(key: str, value, ttl_seconds: int) -> None:
    with _lock:
        _store[key] = (time.monotonic() + max(1, ttl_seconds), value)


def cache_clear() -> None:
    with _lock:
        _store.clear()


def cached(key: str, ttl_seconds: int, producer):
    """Return ``(value, was_cached)``; producer is called only on a miss.

    A producer that returns None is NOT cached so transient failures retry.
    """
    value, hit = cache_get(key)
    if hit:
        return value, True
    value = producer()
    if value is not None:
        cache_set(key, value, ttl_seconds)
        return value, False
    return None, False
