# Interest Matcher

A minimal full-stack web application where users register, track personal interests, and discover other users with overlapping interests. Built with Next.js, Supabase, and deployed on Vercel.

---

## Overview

Interest Matcher solves a simple problem: finding people who share your interests. Users authenticate, curate a list of interests, and the system surfaces other users with similar profiles. A public API endpoint also accepts anonymous interest submissions for external integrations.

### Core Functionality

- **Authentication** — Registration and sign-in via Supabase Auth (email/password).
- **Interest Management** — Authenticated users can add and view their own interests.
- **Similar Users** — The system compares interest sets across users and displays matches ranked by overlap.
- **Public API** — A standalone endpoint (`POST /api/interests`) accepts anonymous interest submissions without authentication.

---

## Tech Stack

| Layer         | Technology | Role                                      |
|---------------|------------|--------------------------------------------|
| Frontend      | Next.js (React) | UI rendering, routing, API routes     |
| Backend       | Next.js API Routes | Server-side logic and public API   |
| Database      | Supabase (PostgreSQL) | Data persistence, row-level security |
| Auth          | Supabase Auth | User registration and session management |
| Hosting       | Vercel      | Deployment, serverless functions, CDN     |

---

## Architecture

```
┌──────────────────────────────────────────────┐
│                   Client                     │
│          Next.js React Frontend              │
└────────────────┬─────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────┐
│            Next.js API Routes                │
│                                              │
│   /api/auth/*        Auth flows              │
│   /api/interests     Public + authed CRUD    │
│   /api/similar       Similar-user matching   │
└────────────────┬─────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────┐
│              Supabase                        │
│                                              │
│   PostgreSQL    Auth    Row-Level Security    │
└──────────────────────────────────────────────┘
```

**Request flow:**

1. The client authenticates through Supabase Auth and receives a session token.
2. Authenticated requests hit Next.js API routes, which validate the session and query Supabase.
3. The similar-users endpoint performs a set-intersection query against all user interest lists and returns matches sorted by overlap count.
4. The public `/api/interests` endpoint bypasses auth and writes directly to an `anonymous_interests` table.

---

## Data Model

### `users`

Managed by Supabase Auth. Extended with a `profiles` table for display metadata.

### `profiles`

| Column       | Type      | Notes                        |
|--------------|-----------|------------------------------|
| `id`         | `uuid`    | FK → `auth.users.id`        |
| `username`   | `text`    | Unique, user-facing          |
| `created_at` | `timestamp` | Default `now()`            |

### `interests`

| Column       | Type      | Notes                        |
|--------------|-----------|------------------------------|
| `id`         | `uuid`    | Primary key                  |
| `user_id`    | `uuid`    | FK → `profiles.id`          |
| `name`       | `text`    | Normalized to lowercase      |
| `created_at` | `timestamp` | Default `now()`            |

Unique constraint on `(user_id, name)` prevents duplicate entries per user.

### `anonymous_interests`

| Column       | Type      | Notes                        |
|--------------|-----------|------------------------------|
| `id`         | `uuid`    | Primary key                  |
| `name`       | `text`    | Interest submitted via API   |
| `metadata`   | `jsonb`   | Optional context from caller |
| `created_at` | `timestamp` | Default `now()`            |

---

## API Reference

### Authentication

Auth is handled entirely through the Supabase client SDK on the frontend. No custom auth endpoints are exposed.

### `GET /api/interests`

Returns the authenticated user's interests.

**Headers:** `Authorization: Bearer <supabase_token>`

**Response (200):**

```json
{
  "interests": [
    { "id": "uuid", "name": "climbing", "created_at": "2026-01-15T10:00:00Z" }
  ]
}
```

### `POST /api/interests`

Adds a new interest. If no auth token is provided, the interest is stored as anonymous.

**Headers (optional):** `Authorization: Bearer <supabase_token>`

**Body:**

```json
{
  "name": "climbing",
  "metadata": {}
}
```

**Response (201):**

```json
{
  "id": "uuid",
  "name": "climbing",
  "anonymous": false
}
```

### `GET /api/similar`

Returns users with overlapping interests, sorted by match count (descending).

**Headers:** `Authorization: Bearer <supabase_token>`

**Response (200):**

```json
{
  "matches": [
    {
      "user_id": "uuid",
      "username": "alex",
      "shared_interests": ["climbing", "rust"],
      "match_count": 2
    }
  ]
}
```

---

## Running Locally

**Prerequisites:** Node.js 18+, a Supabase project.

```bash
# Clone and install
git clone <repo-url>
cd interest-matcher
npm install

# Configure environment
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

# Run database migrations
npx supabase db push

# Start dev server
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## Deployment

The project deploys to Vercel with zero configuration beyond environment variables.

1. Connect the repository to Vercel.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the Vercel dashboard.
3. Push to `main`. Vercel handles the build and deploy automatically.

Row-level security policies in Supabase ensure that users can only read and write their own interests, regardless of how the API is called.

---

## Design Decisions

**Why Supabase over a custom backend?** Auth, Postgres, and row-level security out of the box. For a project this size, writing a custom auth layer or ORM setup would be overhead with no upside.

**Why normalize interest names to lowercase?** Matching is case-insensitive by design. Normalizing at write time keeps the similarity query simple — a plain `JOIN` on `interests.name` rather than runtime `LOWER()` calls.

**Why a separate `anonymous_interests` table?** Keeping anonymous submissions isolated from authenticated data avoids polluting the matching logic and simplifies access control. Anonymous data can be reviewed or merged later without affecting core functionality.

**Why not a dedicated similarity algorithm?** At the current scale, a SQL set-intersection query (count of shared interest names between two users) is fast and correct. If the dataset grows or the matching needs to account for semantic similarity, this is the layer to revisit first.

---

## Limitations and Future Work

- **No interest categories or tags.** Interests are flat strings. Adding taxonomy would improve match quality.
- **No pagination** on the similar-users endpoint. Fine for hundreds of users; will need cursor-based pagination at scale.
- **No rate limiting** on the public API endpoint. Should be added before any production use.
- **Matching is exact-string only.** "Rock Climbing" and "climbing" are treated as different interests. A normalization pipeline or embeddings-based similarity would improve this.
- **No real-time updates.** Users must refresh to see new matches. Supabase Realtime could be wired in for live updates.
