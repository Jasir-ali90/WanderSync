# WanderSync — Database Design (MongoDB)

MongoDB is the primary datastore, accessed through **MongoEngine** document
models. All collections carry `created_at`/`updated_at` timestamps (managed in
each document's `save()`).

## Collections

### `users`
| Field | Type | Notes |
|---|---|---|
| `public_id` | string (16–32 hex) | unique; the identity carried in JWTs |
| `email` | string | unique, normalized lowercase |
| `password` | string | PBKDF2 hash — never plain text |
| `full_name` | string | |
| `is_active`, `is_staff` | bool | |
| `profile` | embedded | `TravelProfile` |
| `notifications` | embedded | `NotificationPreferences` |
| `last_login` | datetime | |

`TravelProfile` (embedded): `avatar_url · home_city · preferred_currency ·
travel_style · interests[] · accommodation_preference ·
transportation_preference · dietary_preferences[] · accessibility_preferences[]`.

Indexes: `email`, `public_id`.

### `trips`
| Field | Type | Notes |
|---|---|---|
| `owner_public_id` | string | owner FK |
| `title`, `destination` | string | |
| `start_date`, `end_date` | date | `duration_days` auto-computed |
| `duration_days` | int | 1–365 |
| `travelers` | int | |
| `budget_amount` / `budget_currency` / `budget_level` | float / string | |
| `travel_style`, `interests[]` | | |
| `status` | enum | draft/planned/active/completed/cancelled |
| `visibility` | enum | private/public |
| `notes` | string | never exposed on share links |
| `itinerary` | embedded | days → activities |
| `optimization_score` / `score_breakdown` / `insights[]` | | Trip Optimization Score |

`Itinerary (embedded)` → `ItineraryDay (day_number, date, title)` →
`Activity (name, description, start_time, duration_minutes, location_name,
latitude, longitude, category, cost_estimate, notes)`.

Indexes: `owner_public_id`, `-created_at`, `(owner_public_id, status)`,
`(owner_public_id, -created_at)`.

### `conversations`
`owner_public_id · title · requirements (dict) · last_trip_id ·
message_count · timestamps`. Indexes: `owner_public_id`, `-updated_at`.

### `messages`
`conversation_id (ObjectId) · owner_public_id · role (user|assistant) ·
content · info (dict structured payload) · created_at`.
Index: `(conversation_id, -created_at)`; ordering by `_id` for stability.

### `shared_trips`
`trip_id (ObjectId, unique) · owner_public_id · token (unique) · revoked ·
views · created_at`. Indexes: `token`, `trip_id`.

### `recommendations`, `notifications`, `analytics_events`
Reserved collections for the personalization / admin phases.

## Indexing Strategy
- Owner-scoped lookups are the hot path → compound indexes leading with
  `owner_public_id`.
- `token` on `shared_trips` is unique (public link lookup).
- No relational joins — ownership in document form avoids cross-collection
  queries for shared flows.