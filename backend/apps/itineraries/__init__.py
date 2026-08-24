"""Itinerary optimization engine.

Pure, dependency-free functions operating on any object with the expected
attributes (MongoEngine ``Activity`` embedded documents in production,
SimpleNamespace fixtures in tests). No I/O, fully unit-testable.

Two responsibilities:
1. ``engine.py``  — geometry & schedule: distances, proximity ordering,
   overlap detection, schedule repair within a realistic day window.
2. ``scoring.py`` — the transparent Trip Optimization Score.
"""
