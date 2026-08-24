# WanderSync

> **Your AI Travel Companion. From Dream to Itinerary.**

WanderSync is a premium, AI-powered travel planning platform. Describe your dream
trip in plain language — destination, duration, budget, interests — and WanderSync
converses with you to fill in the gaps, generates a fully structured day-by-day
itinerary, optimises it geographically and financially, and lets you edit,
regenerate, export (PDF/calendar) and share the result.

## Tech Stack

| Layer     | Technology                                                                 |
| --------- | -------------------------------------------------------------------------- |
| Frontend  | React 19 · TypeScript · Vite · Tailwind CSS · React Router · TanStack Query |
| Forms/UI  | React Hook Form + Zod · Framer Motion · Lucide Icons · Recharts             |
| Backend   | Python 3.12 · Django 5 · Django REST Framework · SimpleJWT                  |
| Database  | MongoDB (via MongoEngine)                                                   |
| AI        | OpenAI API with structured-output validation & safe-repair pipeline         |
| Docs/API  | drf-spectacular (OpenAPI/Swagger)                                           |

## Repository Layout

```
wandersync/
├── frontend/        # React + TypeScript SPA (Vite)
├── backend/         # Django REST Framework API
│   ├── config/      # Project settings, URLs, ASGI/WSGI, Mongo connection
│   ├── apps/        # Modular Django apps (common, accounts, planner, ai, ...)
│   └── integrations/# External provider adapters (OpenAI, maps, weather)
├── docs/            # Architecture diagrams, requirements matrix
├── scripts/         # Dev/deployment helper scripts
└── tests/           # End-to-end test assets
```

## Getting Started

### Prerequisites

- Node.js ≥ 20 & npm
- Python 3.12
- MongoDB 8.x running locally on port 27017

> **Windows dev note:** if the MongoDB Windows service isn't available, start a
> local server with `powershell -ExecutionPolicy Bypass -File scripts\start-mongo.ps1`
> (uses the bundled server binary in `scripts/downloads/bin` and stores data in
> `.mongo-data/`, which is git-ignored).

### Backend


```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows  (use source .venv/bin/activate on macOS/Linux)
pip install -r requirements.txt
copy ..\.env.example .env       # then edit values
python manage.py runserver      # http://localhost:8000
```

Health check: `GET http://localhost:8000/api/v1/health/`

### Frontend

```bash
cd frontend
npm install
npm run dev                     # http://localhost:5173
```

## Environment Variables

See [.env.example](.env.example). All secrets stay server-side; the React app
never receives provider API keys.

## Documentation

- `docs/` — system architecture, data model, API design, requirements traceability

## License

Educational project — APTECH 6th Semester.
