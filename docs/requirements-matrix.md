# Requirements Traceability Matrix

Maps every core SRS capability (per §3 of the project brief) to its backend,
frontend, database, endpoint and test evidence. Core requirements are mandated;
optional enhancements are marked **(opt)** and implemented where stable.

| # | SRS Requirement        | Feature/Implementation          | Backend (Django)   | Frontend        | Database      | API                                     | Tests |
|---|------------------------|--------------------------------|--------------------|-----------------|---------------|-----------------------------------------|-------|
| 1 | User input handling    | Message endpoint, validation    | `apps/planner` (SendMessageSerializer) | Planner chat box, suggestion chips | `conversations`, `messages` | `POST /planner/conversations/{id}/messages/` | planner test_conversations |
| 2 | Conversational interface | Follow-up only on missing fields, state accumulation | `apps/ai/orchestrator` (missing_critical_fields, merge_requirements) | Chat transcript, typing indicator | `conversations.requirements` | same as #1 | follow-up + accumulate tests |
| 3 | AI itinerary generation | OpenAI JSON-mode, Pydantic validation, safe repair, retry, DEMO fallback | `apps/ai/{orchestrator,schemas,prompts,demo}` | Trip list + detail | `trips` (embedded `itinerary`) | planner messages | `test_generation` |
| 4 | External travel APIs   | Provider abstraction, places/weather/hotels/events, TTL cache | `integrations/providers/*`, `apps/travel` | (future map/weather widgets share these) | `integrations.cache` | `GET /places|weather|hotels|events/` | `apps/travel/test_travel_api` |
| 5 | Backend itinerary optimization | Routing, schedule repair, budget fit, preference scoring | `apps/itineraries/{engine,scoring,optimizer}` | score card + insights | `trips.optimization_score` | applied on create/edit | `apps/itineraries`, optimization_integration |
| 6 | Personalization        | Travel profile + preferences drive scoring interests | `apps/accounts` (TravelProfile) | Profile page | `users.profile` | `GET/PATCH /auth/me/` | accounts test profile |
| 7 | Organized itinerary output | Embedded Itinerary/Day/Activity | `apps/trips/documents` | Studio timeline + day tabs | `trips` | `GET /trips/{id}/` | itinerary_studio |
| 8 | Editing                | Add/remove/replace activities, regenerate days, rescoring | `apps/trips/itinerary_services` | Studio controls, ActivityForm | `trips` | `PUT /trips/{id}/days/…`, `POST …/activities/`, `DELETE …/activities/{i}/`, `POST …/regenerate/` | itinerary_studio |
| 9 | Exporting              | Branded PDF + ICS calendar | `apps/exports` | PDF/ICS download buttons | (on-the-fly) | `GET /export/trips/{id}/pdf|ics/` | sharing test_exports |
| 10| Sharing                | Share links, public read-only, revoke | `apps/sharing` | Share banner, `/shared/:token` | `shared_trips` | `POST/DELETE /share/trips/{id}/`, `GET /share/{token}/` | `test_sharing` |
| 11| Performance            | Indexed queries, cached providers, code-split SPA | indexes, cache, `React.lazy` | chunked bundle | indexes | — | builds |
| 12| Security               | JWT rotation, ownership checks, throttling, headers, env secrets | `apps/accounts/auth`, `common/exceptions`, settings | guarded routes, token refresh | secrets in env only | auth endpoints | accounts security tests |
| 13| Scalability            | Stateless API, Mongo indexes, optional Celery | modular apps | — | indexes | — | — |
| 14| Reliability            | Envelope errors, graceful provider/AI failure, no traceback leaks | `common/exceptions` | error states | — | error envelope | failure tests |
| 15| Usability              | Premium design system, responsive, reduced-motion, loading/empty states | DRF validation messages | design system + pages | — | friendly errors | builds + manual QA |
| O1| Voice (enhancement)     | (stable-enhancement; architecturally injected at the chat input) | — | — | — | — | — |
| O2| RAG (enhancement)       | (future; provider + context layer ready) | `integrations` | — | — | — | — |
| O3| Multi-user collaboration (enhancement) | (future; Django Channels ASGI ready) | `config/asgi` | — | — | — | — |

## Coverage Check

- **Every endpoint returns the standard `{success, message, data|error}` envelope.**
- **Django owns all protected logic**: auth, trips, itinerary planning,
  optimization, sharing, exports, notifications-ready.
- **The React app never calls OpenAI or travel providers directly**; all such
  calls go through `/api/v1`.
- **Demo/cached/live provenance** is surfaced so no canned data is presented
  as real-time.
- Full automated suite: **112 backend tests** (accounts, trips, planner+AI,
  itineraries, travel, sharing/exports) — all green.
- CI pipeline installs, lints, types checks and runs the suite (see
  `.github/workflows/ci.yml`).