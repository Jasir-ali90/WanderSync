"""Curated Famous Spots catalog (countries -> iconic places).

Static, hand-curated data served by the API. Coordinates allow the UI to pull
LIVE weather for each spot via the existing /weather endpoint.
"""

SPOT_COUNTRIES = [
    {
        "country": "Italy",
        "code": "it",
        "tagline": "History, art and the world's best pasta",
        "spots": [
            {"name": "Colosseum", "city": "Rome", "emoji": "🏟️", "lat": 41.8902, "lon": 12.4922,
             "description": "The 2,000-year-old amphitheatre where gladiators once fought — Rome's most iconic monument."},
            {"name": "Venice Canals", "city": "Venice", "emoji": "🛶", "lat": 45.4340, "lon": 12.3388,
             "description": "A city built on water: gondola rides through centuries-old canals."},
            {"name": "Leaning Tower of Pisa", "city": "Pisa", "emoji": "🗼", "lat": 43.7230, "lon": 10.3966,
             "description": "The famously tilted bell tower on the green Piazza dei Miracoli."},
        ],
    },
    {
        "country": "France",
        "code": "fr",
        "tagline": "Art, cafés and timeless elegance",
        "spots": [
            {"name": "Eiffel Tower", "city": "Paris", "emoji": "🗼", "lat": 48.8584, "lon": 2.2945,
             "description": "The iron lady of Paris — sparkling light show every evening since 1889."},
            {"name": "Louvre Museum", "city": "Paris", "emoji": "🖼️", "lat": 48.8606, "lon": 2.3376,
             "description": "Home of the Mona Lisa and 35,000 works spanning human civilisation."},
            {"name": "Palace of Versailles", "city": "Versailles", "emoji": "👑", "lat": 48.8049, "lon": 2.1204,
             "description": "The Hall of Mirrors and endless royal gardens of the French monarchy."},
        ],
    },
    {
        "country": "Japan",
        "code": "jp",
        "tagline": "Where tradition meets neon future",
        "spots": [
            {"name": "Mount Fuji", "city": "Honshu", "emoji": "🗻", "lat": 35.3606, "lon": 138.7274,
             "description": "Japan's sacred snow-capped volcano — postcard-perfect from every angle."},
            {"name": "Fushimi Inari Shrine", "city": "Kyoto", "emoji": "⛩️", "lat": 34.9671, "lon": 135.7727,
             "description": "Ten thousand vermilion torii gates winding up a forested mountain."},
            {"name": "Shibuya Crossing", "city": "Tokyo", "emoji": "🌃", "lat": 35.6595, "lon": 139.7005,
             "description": "The world's busiest scramble crossing, wrapped in neon."},
        ],
    },
    {
        "country": "Türkiye",
        "code": "tr",
        "tagline": "Two continents, one skyline",
        "spots": [
            {"name": "Hagia Sophia", "city": "Istanbul", "emoji": "🕌", "lat": 41.0086, "lon": 28.9802,
             "description": "1,500 years of history as church, mosque and museum under one vast dome."},
            {"name": "Cappadocia Balloons", "city": "Göreme", "emoji": "🎈", "lat": 38.6431, "lon": 34.8306,
             "description": "Sunrise hot-air balloons drifting over fairy-chimney valleys."},
            {"name": "Pamukkale Terraces", "city": "Denizli", "emoji": "♨️", "lat": 37.9203, "lon": 29.1209,
             "description": "Cotton-white travertine pools formed by thermal springs."},
        ],
    },
    {
        "country": "United Arab Emirates",
        "code": "ae",
        "tagline": "Futuristic skylines on golden sands",
        "spots": [
            {"name": "Burj Khalifa", "city": "Dubai", "emoji": "🌆", "lat": 25.1972, "lon": 55.2744,
             "description": "The tallest building on Earth — observation decks on level 148."},
            {"name": "Sheikh Zayed Mosque", "city": "Abu Dhabi", "emoji": "🕌", "lat": 24.4128, "lon": 54.4750,
             "description": "82 marble domes and the world's largest hand-knotted carpet."},
            {"name": "Desert Safari Dunes", "city": "Dubai", "emoji": "🐪", "lat": 24.8000, "lon": 55.5500,
             "description": "Dune-bashing, camel rides and Bedouin camps under desert stars."},
        ],
    },
    {
        "country": "Malaysia",
        "code": "my",
        "tagline": "Rainforests, towers and island paradise",
        "spots": [
            {"name": "Petronas Twin Towers", "city": "Kuala Lumpur", "emoji": "🏢", "lat": 3.1578, "lon": 101.7117,
             "description": "The world's tallest twin towers linked by a sky bridge."},
            {"name": "Batu Caves", "city": "Selangor", "emoji": "🗿", "lat": 3.2379, "lon": 101.6840,
             "description": "A 42-metre golden statue guarding 272 rainbow steps into limestone caves."},
            {"name": "Langkawi Sky Bridge", "city": "Langkawi", "emoji": "🌉", "lat": 6.4099, "lon": 99.6807,
             "description": "A curved bridge suspended 660 m above the rainforest canopy."},
        ],
    },
    {
        "country": "Egypt",
        "code": "eg",
        "tagline": "Walk through five millennia",
        "spots": [
            {"name": "Pyramids of Giza", "city": "Cairo", "emoji": "🔺", "lat": 29.9792, "lon": 31.1342,
             "description": "The last surviving Wonder of the Ancient World, guarded by the Sphinx."},
            {"name": "Luxor Temple", "city": "Luxor", "emoji": "🏛️", "lat": 25.6996, "lon": 32.6394,
             "description": "Colossal columns and obelisks lit golden at night along the Nile."},
            {"name": "Red Sea Riviera", "city": "Hurghada", "emoji": "🐠", "lat": 27.2279, "lon": 33.8395,
             "description": "World-class coral reefs in crystal-clear turquoise water."},
        ],
    },
    {
        "country": "Switzerland",
        "code": "ch",
        "tagline": "Alpine lakes and storybook villages",
        "spots": [
            {"name": "Matterhorn", "city": "Zermatt", "emoji": "🏔️", "lat": 45.9763, "lon": 7.6586,
             "description": "The pyramid peak that defines the Alps — best seen from car-free Zermatt."},
            {"name": "Lake Geneva", "city": "Geneva", "emoji": "🚤", "lat": 46.2044, "lon": 6.1432,
             "description": "Azure waters framed by vineyards and the Jet d'Eau fountain."},
            {"name": "Jungfraujoch", "city": "Interlaken", "emoji": "🚞", "lat": 46.5477, "lon": 7.9856,
             "description": "'Top of Europe' — a railway station at 3,454 m inside the glacier."},
        ],
    },
]


def get_spot_catalog(country: str | None = None) -> dict:
    if country:
        needle = country.strip().lower()
        matches = [e for e in SPOT_COUNTRIES if needle in e["country"].lower()]
        return {"count": len(matches), "countries": matches}
    return {"count": len(SPOT_COUNTRIES), "countries": SPOT_COUNTRIES}
