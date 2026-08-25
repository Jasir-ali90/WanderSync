# WanderSync

> **Your AI Travel Companion. From Dream to Itinerary.**

WanderSync is a premium, competition-grade AI travel planning platform.
Describe your dream trip in plain language — destination, duration, budget,
interests — and WanderSync converses with you to fill the gaps, generates a
fully structured day-by-day itinerary, **optimises it geographically and
financially**, and lets you edit, regenerate, export (branded PDF + calendar)
and share the result with a public link.

## ✨ Features

- **Conversational AI planner** — extracts requirements, asks *only* missing
  questions, remembers the whole conversation, creates real trips
- **Itinerary engine** — haversine routing, schedule repair, overlap/budget
  checks, and a transparent **Trip Optimization Score** (0–100)
- **Itinerary studio** — day tabs, add/remove/replace activities, six
  regenerate-day moods (relaxed → packed), live re-scoring on every edit
- **Live travel data** — OpenStreetMap/Nominatim places & Open-Meteo weather,
  with `live|cache|demo` provenance so nothing fake is shown as real
- **Budget intelligence** — per-day estimates vs. declared budget
- **Exports** — branded PDF (ReportLab) and ICS calendar
- **Sharing** — revocable public links that strip private notes
- **Design system** — premium dark UI, Framer Motion, fully responsive,
  reduced-motion aware

## Tech Stack

| Layer     | Technology                                                                 |
| --------- | -------------------------------------------------------------------------- |
| Frontend  | React 19 · TypeScript · Vite · Tailwind CSS v4 · React Router · TanStack Query · RHF + Zod · Framer Motion · Lucide |
| Backend   | Python 3.12 · Django 5.2 · Django REST Framework · SimpleJWT               |
| Database  | MongoDB (MongoEngine ODM)                                                  |
| AI        | OpenAI JSON-mode with Pydantic validation + safe repair + DEMO fallback    |
| Data      | Nominatim/OSM · Open-Meteo · provider abstraction + TTL cache              |
| Docs/API  | drf-spectacular — Swagger UI at `/api/v1/schema/swagger-ui/`              |

## Repository Layout

```
wandersync/
├── frontend/        # React + TypeScript SPA (Vite, code-split routes)
├── backend/         # Django REST Framework API
│   ├── config/      # Settings, URLs, ASGI/WSGI, Mongo db, test runner
│   ├── apps/         # accounts · trips · planner · ai · itineraries ·
│   │                 # travel · sharing · exports · common
│   └── integrations/ # OpenAI client, HTTP helper, cache, provider adapters
├── docs/            # architecture.md · requirements-matrix.md · database.md
├── scripts/         # Mongo start, smoke tests, setup helpers
└── .github/         # CI workflow (backend + frontend checks)
```

## Getting Started

### Prerequisites
- Node.js ≥ 20 and npm
- Python 3.12
- MongoDB 8.x on `localhost:27017`

> **Windows dev note:** no MongoDB service? Run
> `powershell -ExecutionPolicy Bypass -File scripts\start-mongo.ps1`
> (bundled server binary, data in git-ignored `.mongo-data/`).

### Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate                # Windows · source .venv/bin/activate on macOS/Linux
pip install -r requirements.txt
copy ..\.env.example .env            # then edit values (see below)
python manage.py runserver           # http://localhost:8000
```
Health check: `GET http://localhost:8000/api/v1/health/`
Swagger UI: `http://localhost:8000/api/v1/schema/swagger-ui/`

### Frontend
```bash
cd frontend
npm install
npm run dev                          # http://localhost:5173 (proxies /api to :8000)
```

### Environment Variables
See [.env.example](.env.example). All secrets stay server-side — the React app
never receives provider keys. Minimum to run end-to-end in demo mode: nothing
extra needed. Optional for live AI: `OPENAI_API_KEY`.

## Demo Account (no key required)

Without `OPENAI_API_KEY` the app runs a full **DEMO mode** that behaves exactly
like the real one (local extraction + generated demo itineraries, clearly
labelled). Register any account and try:

1. Planner → *“Plan a 3-day trip to Rome with a $800 budget for 2 people.”*
2. Open the generated trip in **Trips** → play with regenerate/edits.
3. Export the PDF / calendar, or create a share link and open it incognito.

## Testing

```bash
# Backend (needs MongoDB on 27017; uses isolated `wandersync_test` DB)
cd backend
python manage.py test --settings=config.settings.test

# Frontend lint + type-check + production build
cd frontend
npm run lint && npm run build
```

Current suite: **112 backend tests** across auth, trips, planner/AI,
itinerary engine/scoring, travel providers and sharing/exports — all green.

## Deployment

Production readiness is built-in:

- **Backend** — run via a real WSGI server (`waitress` on Windows, `gunicorn`
  elsewhere): `python -m waitress --listen=0.0.0.0:8000 config.wsgi`
- **Settings** — `DJANGO_DEBUG=false`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`,
  `SECURE_SSL_REDIRECT`, secure cookie flags, security headers
- **Database** — MongoDB Atlas connection string via `MONGODB_URI`
- **Frontend** — `npm run build` → static `dist/` (any static host/CDN);
  configure the `/api` proxy or same-origin serving
- **Swagger/OpenAPI** — committed check in CI
- **CI** — `.github/workflows/ci.yml` installs deps, lints, type-checks,
  system-checks, and runs the full back-to-FAIL suite against a Mongo service
- **Optional** — Celery + Redis for background exports/recommendations

## Security

- JWT access + rotating refresh tokens; tokens carry only a UUID
- PBKDF2 password hashing; hashes never returned
- Server-side ownership checks on every private endpoint (foreign → 404)
- Rate limiting scopes: `auth`, `ai`, `export`, `user`, `anon`
- Secrets in env vars only; the browser never sees provider keys
- Prompt-injection hardening; user content treated as untrusted data
- Live/cached/demo data provenance labels

## Documentation

- [`docs/architecture.md`](docs/architecture.md) — system/sequence/ERD/deployment diagrams
- [`docs/requirements-matrix.md`](docs/requirements-matrix.md) — SRS traceability
- [`docs/database.md`](docs/database.md) — MongoDB collection design

## License

Educational project — APTECH 6th Semester.