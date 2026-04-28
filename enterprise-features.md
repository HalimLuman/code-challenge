# Enterprise Feature Roadmap — Interest Matcher

This document catalogues the features required to bring Interest Matcher from an MVP to a
production-grade, enterprise-ready application. Each section identifies the gap in the current
codebase and specifies what needs to be built, including new routes, schema changes, and
UI requirements.

---

## Table of Contents

1. [Authentication & Account Management](#1-authentication--account-management)
2. [User Communication](#2-user-communication)
3. [UI / UX System](#3-ui--ux-system)
4. [Legal, Compliance & Data Protection](#4-legal-compliance--data-protection)
5. [Profile System](#5-profile-system)
6. [Interest Intelligence](#6-interest-intelligence)
7. [Security & API Hardening](#7-security--api-hardening)
8. [Admin & Moderation](#8-admin--moderation)
9. [Observability & Infrastructure](#9-observability--infrastructure)
10. [Schema Additions Summary](#10-schema-additions-summary)

---

## 1. Authentication & Account Management

### 1.1 Forgot Password / Reset Password

**Current gap:** The login page has no recovery path. A locked-out user cannot regain access.

**What to build:**

| Route | Purpose |
|---|---|
| `GET /forgot-password` | Form: user enters email address |
| `GET /reset-password` | Form: user enters new password (token from email link) |
| `POST /api/auth/reset-request` | Calls `supabase.auth.resetPasswordForEmail()` |
| `POST /api/auth/reset-confirm` | Calls `supabase.auth.updateUser({ password })` after token validation |

Supabase handles the email delivery and token lifecycle. The app needs the two pages and a
confirmation screen ("Check your inbox") with a resend link that is rate-limited to one request
per 60 seconds.

---

### 1.2 Email Verification

**Current gap:** `supabase.auth.signUp()` sends a confirmation email by default, but the app
redirects straight to `/dashboard` without checking `user.email_confirmed_at`. An unverified
user has full write access.

**What to build:**

- Check `user.email_confirmed_at` in `middleware.ts`; redirect unverified users to a
  `/verify-email` holding page.
- `GET /verify-email` — static page explaining the next step with a resend button.
- `POST /api/auth/resend-verification` — calls `supabase.auth.resend()`, rate-limited per session.
- On successful email click, Supabase redirects to `/auth/callback`; the app then moves the user
  to `/dashboard`.

---

### 1.3 OAuth Sign-In (Google / GitHub)

**Current gap:** Only email/password is supported. Enterprise users expect SSO.

**What to build:**

- "Continue with Google" and "Continue with GitHub" buttons on both `/login` and `/register`.
- `GET /auth/callback` — route handler that calls `supabase.auth.exchangeCodeForSession()`
  and then creates a `profiles` row if one does not yet exist (OAuth users skip the register form).
- Add `avatar_url` column to `profiles` populated from the OAuth provider's profile data on
  first login.

---

### 1.4 Session Management

**Current gap:** No visibility into active sessions; no way to terminate a stolen session remotely.

**What to build:**

- `GET /settings/sessions` — lists active sessions (`supabase.auth.admin.listUserSessions()`
  via service-role key, server component).
- `DELETE /api/auth/sessions?id=` — revokes a specific session.
- "Sign out all other devices" button that calls `supabase.auth.signOut({ scope: 'others' })`.

---

### 1.5 Account Deletion (GDPR Right to Erasure)

**Current gap:** No mechanism for users to delete their account or data.

**What to build:**

- `GET /settings/account` — danger zone section with a "Delete my account" button.
- Confirmation modal requiring the user to type their username.
- `DELETE /api/auth/account` — cascades deletion through `profiles → interests` (already
  handled by FK `on delete cascade`), then calls `supabase.auth.admin.deleteUser(id)`.
- Log the deletion event in an `audit_logs` table before executing.

---

### 1.6 Two-Factor Authentication (TOTP)

**What to build:**

- `GET /settings/security` — shows 2FA status; enrol / disable buttons.
- Enrolment flow: display QR code (`supabase.auth.mfa.enroll()`), confirm with a 6-digit code
  (`supabase.auth.mfa.challengeAndVerify()`).
- Post-login challenge page (`/auth/mfa`) shown when the user's assurance level is below
  `aal2` — middleware checks `supabase.auth.mfa.getAuthenticatorAssuranceLevel()`.

---

## 2. User Communication

### 2.1 Connection Requests

**Current gap:** Similar users are surfaced but there is no way to act on a match. Users are
strangers to one another with no opt-in mechanism.

**What to build:**

New table: `connection_requests`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `sender_id` | `uuid` | FK → `profiles.id` |
| `recipient_id` | `uuid` | FK → `profiles.id` |
| `status` | `text` | `pending` \| `accepted` \| `declined` |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

Unique constraint on `(sender_id, recipient_id)`.

Routes:

| Route | Method | Purpose |
|---|---|---|
| `/api/connections` | `POST` | Send a connection request |
| `/api/connections?id=` | `PATCH` | Accept or decline |
| `/api/connections` | `GET` | List incoming pending requests |

UI:

- "Connect" button on each card in the `SimilarUsers` list; changes to "Pending" once sent and
  "Connected" once accepted.
- `/connections` page — inbox of pending requests with Accept / Decline buttons.

---

### 2.2 Direct Messaging

**Current gap:** No communication channel exists between connected users.

**What to build:**

New table: `messages`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `conversation_id` | `uuid` | FK → `conversations.id` |
| `sender_id` | `uuid` | FK → `profiles.id` |
| `body` | `text` | Max 2000 characters |
| `read_at` | `timestamptz` | Nullable |
| `created_at` | `timestamptz` | |

New table: `conversations`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `participant_a` | `uuid` | FK → `profiles.id` (lower UUID) |
| `participant_b` | `uuid` | FK → `profiles.id` (higher UUID) |
| `created_at` | `timestamptz` | |

Unique constraint on `(participant_a, participant_b)`. Enforce that only accepted connections
can message via RLS policy.

Routes:

| Route | Method | Purpose |
|---|---|---|
| `/api/conversations` | `GET` | List all conversations with last message preview |
| `/api/conversations` | `POST` | Start a conversation (requires accepted connection) |
| `/api/conversations/[id]/messages` | `GET` | Paginated message history |
| `/api/conversations/[id]/messages` | `POST` | Send a message |

UI:

- `/messages` — conversation list sidebar + message thread panel.
- Unread badge in the header nav.
- Real-time updates via `supabase.channel()` subscription on the `messages` table.

---

### 2.3 In-App Notifications

**What to build:**

New table: `notifications`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK → `profiles.id` |
| `type` | `text` | `connection_request` \| `connection_accepted` \| `new_message` |
| `payload` | `jsonb` | Contextual data (sender username, conversation id, etc.) |
| `read_at` | `timestamptz` | Nullable |
| `created_at` | `timestamptz` | |

- Bell icon in the header with an unread count badge (Supabase Realtime subscription).
- `GET /api/notifications` — list unread; `PATCH /api/notifications?id=` — mark read.
- Notifications are created server-side by database triggers on `connection_requests` and
  `messages` inserts.

---

### 2.4 Email Notifications

**What to build:**

- Transactional email service integration (Resend recommended — native Next.js support).
- `lib/email.ts` — wrapper around the Resend SDK.
- Triggered for: new connection request, accepted connection, new message (digest if unread
  for > 15 minutes), password reset (replaces Supabase default template).
- Env vars: `RESEND_API_KEY`, `EMAIL_FROM`.
- Supabase DB webhooks or Postgres triggers call `POST /api/webhooks/notify` (secured with a
  shared secret) to queue emails without blocking the user request.

---

## 3. UI / UX System

### 3.1 Design System

**Current gap:** Components use ad-hoc Tailwind classes with no shared tokens. Scaling the UI
will produce inconsistencies.

**What to build:**

- Install `shadcn/ui` as the component library (built on Radix UI + Tailwind; no runtime overhead).
- Replace all raw `<input>`, `<button>`, and `<form>` elements with `Input`, `Button`, and `Form`
  from shadcn/ui.
- Define a CSS custom-property palette in `globals.css`:
  - Primary, secondary, destructive, muted, accent, background, foreground tokens.
- `components/ui/` — generated shadcn components live here; project components stay in `components/`.

---

### 3.2 Dark Mode

**What to build:**

- `next-themes` package for SSR-safe theme switching.
- Wrap `<body>` in `<ThemeProvider>` in `app/layout.tsx`.
- Toggle button in the header (sun/moon icon).
- Tailwind `darkMode: 'class'` already supported; apply `dark:` variants to all components.

---

### 3.3 Loading & Skeleton States

**Current gap:** The dashboard fetches data server-side but shows nothing until hydrated. Client
mutations have no visual feedback beyond the disabled button.

**What to build:**

- `app/dashboard/loading.tsx` — skeleton layout matching the two-column grid using
  `animate-pulse` placeholder blocks.
- `components/ui/Skeleton.tsx` — reusable skeleton primitive.
- Optimistic UI for interest add: append the new interest to the list immediately and revert on
  error, using React's `useOptimistic` hook.

---

### 3.4 Toast Notifications

**What to build:**

- `shadcn/ui` Sonner integration for toast messages.
- Replace all inline `error` state strings in `AddInterestForm`, `InterestList`, and auth pages
  with `toast.error()` / `toast.success()` calls.

---

### 3.5 Onboarding Flow

**What to build:**

- After successful registration, redirect to `/onboarding` instead of `/dashboard`.
- Step 1: Welcome + prompt to add 3+ interests (with suggestions).
- Step 2: Privacy settings (profile visibility: `public` | `connections-only` | `private`).
- Step 3: Accept Terms & Privacy Policy (checkbox with links) — gate account activation on acceptance.
- Store completion in `profiles.onboarding_complete boolean default false`; middleware redirects
  incomplete users to `/onboarding` if they try to visit `/dashboard`.

---

### 3.6 Public Profile Pages

**What to build:**

- `app/profile/[username]/page.tsx` — server component showing username, bio, join date, and
  shared interests (if connection exists).
- Visibility is enforced server-side based on `profiles.visibility` and the session state.
- "Connect" button rendered if the viewer is authenticated and not already connected.

---

## 4. Legal, Compliance & Data Protection

### 4.1 Terms of Service Page

**Route:** `GET /terms`

**Content outline:**

1. Acceptance of Terms
2. Description of Service
3. Eligibility (minimum age 16 / 18 depending on jurisdiction)
4. User Accounts — registration accuracy, credential responsibility
5. Acceptable Use — prohibited content, harassment, spam
6. Interest Data — how it is stored, processed, and used for matching
7. Public API — terms for anonymous submissions
8. Intellectual Property
9. Disclaimers and Limitation of Liability
10. Termination — how and why accounts can be suspended
11. Changes to Terms — notification mechanism
12. Governing Law and Dispute Resolution
13. Contact Information

**Implementation:**

- Static Server Component at `app/(legal)/terms/page.tsx`.
- Shared layout `app/(legal)/layout.tsx` — clean reading layout with max-width prose, table of
  contents sidebar on desktop.
- Versioned: store `terms_version` string (e.g. `"2026-04"`) in an env var and in the
  `consent_records` table.

---

### 4.2 Privacy Policy Page

**Route:** `GET /privacy`

**Content outline (GDPR / UK GDPR / CCPA aligned):**

1. Data Controller Identity and Contact Details
2. What Personal Data We Collect
   - Account data: email address, username, password hash (managed by Supabase Auth)
   - Interest data: interest names linked to your account
   - Anonymous submissions: interest name, optional metadata, IP address
   - Usage data: session tokens, timestamps
3. How We Use Your Data
   - Authentication and account management
   - Interest matching (set intersection — no ML model, no third-party profiling)
   - Service improvement
4. Legal Basis for Processing (GDPR Article 6)
   - Contract performance (authentication, core features)
   - Legitimate interest (security, fraud prevention)
   - Consent (marketing emails — not currently collected, placeholder for future)
5. Data Retention
   - Active accounts: retained while account is active
   - Deleted accounts: hard-deleted within 30 days; anonymous submissions retained 90 days
6. Data Sharing and Third Parties
   - Supabase (data processor, EU-hosted option available)
   - Vercel (hosting, edge functions — data in transit only)
   - Resend (transactional email — email address only)
7. International Transfers
8. Your Rights (GDPR Articles 15–22)
   - Right of access (`GET /api/data-export`)
   - Right to rectification (profile settings)
   - Right to erasure (`DELETE /api/auth/account`)
   - Right to restriction
   - Right to data portability (JSON export)
   - Right to object
9. Cookie Policy — session cookies only; no advertising or analytics cookies by default
10. Changes to This Policy
11. How to Contact Us / Lodge a Complaint

**Implementation:**

- `app/(legal)/privacy/page.tsx` — same layout as Terms.
- Include effective date and version number in the document header.

---

### 4.3 Cookie Consent Banner

**Current gap:** No disclosure of cookie usage. Required under ePrivacy Directive (EU) even for
strictly necessary cookies.

**What to build:**

- `components/CookieBanner.tsx` — client component, shown on first visit to any page.
- Stores consent decision in `localStorage` (`cookie_consent: "accepted" | "declined"`).
- For strictly necessary cookies (session): no opt-out, but disclosure is mandatory.
- Banner copy must link to the Privacy Policy.
- Rendered in `app/layout.tsx` outside of Suspense boundaries to avoid layout shift.

---

### 4.4 Consent Records

New table: `consent_records`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK → `profiles.id` |
| `terms_version` | `text` | e.g. `"2026-04"` |
| `privacy_version` | `text` | e.g. `"2026-04"` |
| `accepted_at` | `timestamptz` | |
| `ip_address` | `inet` | For audit purposes |

- Written during onboarding step 3.
- If Terms are updated, `middleware.ts` compares the user's latest `consent_records` row
  against the current version env var and redirects to `/terms/accept` if stale.
- `GET /api/data-export` — returns a JSON file containing all of the requesting user's data
  (profile, interests, messages, consent records) for GDPR portability compliance.

---

### 4.5 Age Gate

- Add `date_of_birth` to the register form (optional but recommended).
- Server-side: reject registration if calculated age is below the configured minimum (default 16).
- Store only year-of-birth in `profiles` (minimum data principle); do not store the full date.

---

## 5. Profile System

### 5.1 Extended Profile Fields

Add to `profiles`:

| Column | Type | Notes |
|---|---|---|
| `bio` | `text` | Max 280 characters |
| `avatar_url` | `text` | Supabase Storage URL |
| `location` | `text` | Free-text, optional |
| `website` | `text` | URL, optional |
| `visibility` | `text` | `public` \| `connections` \| `private`; default `public` |
| `onboarding_complete` | `boolean` | Default `false` |

---

### 5.2 Avatar Upload

**What to build:**

- Supabase Storage bucket `avatars` with RLS: owner can write, public can read.
- `components/AvatarUpload.tsx` — client component with file picker, client-side crop
  (using `react-image-crop`), and upload to `/api/profile/avatar`.
- `POST /api/profile/avatar` — validates file type (JPEG/PNG/WebP only), max 2 MB, resizes
  server-side to 256×256 using `sharp`, stores in `avatars/{user_id}.webp`.

---

### 5.3 Settings Page

**Route:** `GET /settings`

Tabs:

| Tab | Content |
|---|---|
| Profile | Edit username, bio, location, website, avatar |
| Privacy | Visibility selector, block list |
| Security | Password change, 2FA, active sessions |
| Notifications | Email notification preferences |
| Account | Export data, delete account |

---

## 6. Interest Intelligence

### 6.1 Interest Autocomplete

**Current gap:** Users type free-text interests, leading to fragmentation ("js", "javascript",
"JavaScript").

**What to build:**

- New table: `interest_taxonomy` — a curated list of canonical interest names (seeded from a
  CSV of ~500 common interests).
- `GET /api/interests/suggest?q=` — returns up to 8 matches using `ILIKE '%query%'` on the
  taxonomy table.
- `AddInterestForm` shows a dropdown of suggestions as the user types (debounced 200ms).
- Free-text entry remains allowed; suggestions are not mandatory.

---

### 6.2 Trending Interests

**What to build:**

- Materialised view `trending_interests` — top 20 interests by distinct user count, refreshed
  hourly via `pg_cron`.
- Dashboard sidebar widget showing trending interests as clickable chips; clicking one adds it
  to the user's list.

---

### 6.3 Interest Categories

**What to build:**

- Add `category` column to `interest_taxonomy` (e.g. Technology, Sports, Arts, Science).
- Dashboard filter: tabs or a dropdown to filter the Similar Users list by category of shared
  interest.

---

## 7. Security & API Hardening

### 7.1 Rate Limiting

**Current gap:** `POST /api/interests` (public endpoint) and the auth routes have no rate
limiting. This is listed as a known limitation in the documentation.

**What to build:**

- `lib/ratelimit.ts` — wrapper using Upstash Redis (`@upstash/ratelimit`) with sliding-window
  algorithm.
- Apply limits per IP:
  - Public `POST /api/interests`: 20 requests / 5 minutes
  - `POST /api/auth/reset-request`: 3 requests / hour
  - `POST /api/auth/resend-verification`: 3 requests / hour
  - `POST /api/conversations/[id]/messages`: 60 requests / minute
- Return `429 Too Many Requests` with a `Retry-After` header.

---

### 7.2 Input Validation

**Current gap:** API routes do minimal validation — only `name` presence is checked.

**What to build:**

- Install `zod` for schema validation.
- `lib/validators.ts` — shared Zod schemas for each request body.
- Validate all API route inputs; return structured `422 Unprocessable Entity` with field-level
  error messages.
- Sanitise the `metadata` field in `POST /api/interests` to strip unexpected keys.

---

### 7.3 Security Headers

**What to build:**

- Add to `next.config.mjs`:
  ```js
  headers: async () => [{
    source: '/(.*)',
    headers: [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'Content-Security-Policy', value: "default-src 'self'; ..." },
    ],
  }]
  ```

---

### 7.4 Audit Logging

New table: `audit_logs`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `actor_id` | `uuid` | FK → `profiles.id`; nullable for anonymous actions |
| `action` | `text` | e.g. `account.deleted`, `interest.added`, `message.sent` |
| `target_id` | `uuid` | The affected resource ID |
| `metadata` | `jsonb` | Contextual detail |
| `ip_address` | `inet` | |
| `created_at` | `timestamptz` | |

- Written for: account deletion, password reset, 2FA enrol/disable, admin actions.
- No RLS — only readable via service-role; powers the admin dashboard.

---

### 7.5 Content Security

**What to build:**

- Sanitise all user-generated text rendered to the DOM using `DOMPurify` (client) or a
  server-side allowlist (API layer) to prevent stored XSS.
- `message.body` in particular must be sanitised before storage and again before render.

---

## 8. Admin & Moderation

### 8.1 Admin Dashboard

**What to build:**

- `app/admin/` — protected route group; middleware checks `profiles.role = 'admin'`.
- Add `role text default 'user'` column to `profiles`.
- Admin overview: total users, interests, messages, connections — live from Supabase.
- User list with search, sort, ability to view profile, suspend, or delete.

---

### 8.2 Report & Block System

New table: `reports`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `reporter_id` | `uuid` | FK → `profiles.id` |
| `reported_id` | `uuid` | FK → `profiles.id` |
| `reason` | `text` | `spam` \| `harassment` \| `inappropriate` \| `other` |
| `detail` | `text` | Optional free text, max 500 chars |
| `status` | `text` | `open` \| `resolved` \| `dismissed` |
| `created_at` | `timestamptz` | |

New table: `blocks`

| Column | Type | Notes |
|---|---|---|
| `blocker_id` | `uuid` | FK → `profiles.id` |
| `blocked_id` | `uuid` | FK → `profiles.id` |
| `created_at` | `timestamptz` | |

- Blocking hides the blocked user from all queries (interest matches, conversations, profiles)
  via additions to `get_similar_users` and RLS policies.
- "Report" and "Block" actions surface on profile pages and in the message thread header.
- Admin queue at `/admin/reports` for reviewing open reports.

---

## 9. Observability & Infrastructure

### 9.1 Error Monitoring

**What to build:**

- Sentry integration (`@sentry/nextjs`) with `sentry.client.config.ts` and
  `sentry.server.config.ts`.
- Instrument all API routes and server components.
- Set `SENTRY_DSN` env var; redact PII from error reports in `beforeSend`.

---

### 9.2 Analytics

**What to build:**

- Plausible Analytics (privacy-preserving, no cookie consent required for basic usage) via a
  `<Script>` tag in `app/layout.tsx`.
- Custom events: `interest_added`, `connection_sent`, `message_sent` — all sent without PII.

---

### 9.3 Automated Testing

**What to build:**

- `vitest` + `@testing-library/react` for component unit tests.
- Playwright for E2E: register → add interest → sign out → sign in → verify interest present.
- Test database: Supabase local dev stack (`supabase start`) seeded with fixture data.
- CI workflow (GitHub Actions): install → lint → type-check → unit tests → E2E on PR.

---

### 9.4 Environment Configuration

**What to build:**

- `lib/env.ts` — validated env schema using `zod.parse` at startup; fails the build loudly
  if a required variable is missing rather than producing a runtime crash.
- `.env.example` extended with all new variables:
  ```
  RESEND_API_KEY=
  UPSTASH_REDIS_REST_URL=
  UPSTASH_REDIS_REST_TOKEN=
  SENTRY_DSN=
  NEXT_PUBLIC_PLAUSIBLE_DOMAIN=
  WEBHOOK_SECRET=
  TERMS_VERSION=2026-04
  PRIVACY_VERSION=2026-04
  MIN_AGE=16
  ```

---

## 10. Schema Additions Summary

```sql
-- 002_profiles_extended.sql
alter table profiles
  add column bio                text check (char_length(bio) <= 280),
  add column avatar_url         text,
  add column location           text,
  add column website            text,
  add column visibility         text not null default 'public'
                                check (visibility in ('public', 'connections', 'private')),
  add column role               text not null default 'user'
                                check (role in ('user', 'admin')),
  add column onboarding_complete boolean not null default false;

-- 003_connections.sql
create table connection_requests (
  id           uuid primary key default gen_random_uuid(),
  sender_id    uuid not null references profiles(id) on delete cascade,
  recipient_id uuid not null references profiles(id) on delete cascade,
  status       text not null default 'pending'
               check (status in ('pending', 'accepted', 'declined')),
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  unique (sender_id, recipient_id)
);

-- 004_messaging.sql
create table conversations (
  id            uuid primary key default gen_random_uuid(),
  participant_a uuid not null references profiles(id) on delete cascade,
  participant_b uuid not null references profiles(id) on delete cascade,
  created_at    timestamptz default now(),
  unique (participant_a, participant_b),
  check (participant_a < participant_b)
);

create table messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id       uuid not null references profiles(id) on delete cascade,
  body            text not null check (char_length(body) between 1 and 2000),
  read_at         timestamptz,
  created_at      timestamptz default now()
);
create index on messages (conversation_id, created_at desc);

-- 005_notifications.sql
create table notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  type       text not null
             check (type in ('connection_request', 'connection_accepted', 'new_message')),
  payload    jsonb default '{}',
  read_at    timestamptz,
  created_at timestamptz default now()
);
create index on notifications (user_id, read_at) where read_at is null;

-- 006_legal.sql
create table consent_records (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references profiles(id) on delete cascade,
  terms_version    text not null,
  privacy_version  text not null,
  accepted_at      timestamptz default now(),
  ip_address       inet
);

-- 007_moderation.sql
create table blocks (
  blocker_id uuid not null references profiles(id) on delete cascade,
  blocked_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (blocker_id, blocked_id)
);

create table reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles(id) on delete cascade,
  reported_id uuid not null references profiles(id) on delete cascade,
  reason      text not null
              check (reason in ('spam', 'harassment', 'inappropriate', 'other')),
  detail      text check (char_length(detail) <= 500),
  status      text not null default 'open'
              check (status in ('open', 'resolved', 'dismissed')),
  created_at  timestamptz default now()
);

-- 008_audit.sql
create table audit_logs (
  id         uuid primary key default gen_random_uuid(),
  actor_id   uuid references profiles(id) on delete set null,
  action     text not null,
  target_id  uuid,
  metadata   jsonb default '{}',
  ip_address inet,
  created_at timestamptz default now()
);

-- 009_interests_taxonomy.sql
create table interest_taxonomy (
  id       uuid primary key default gen_random_uuid(),
  name     text unique not null,
  category text not null
);
create index on interest_taxonomy using gin (name gin_trgm_ops);
```

---

## Priority Order for Implementation

| Priority | Feature | Rationale |
|---|---|---|
| P0 | Forgot password (1.1) | Blocks real users from recovering accounts |
| P0 | Email verification (1.2) | Security hole allowing unverified write access |
| P0 | Terms & Privacy pages (4.1, 4.2) | Legal requirement before any public launch |
| P0 | Cookie banner (4.3) | ePrivacy Directive compliance |
| P0 | Rate limiting (7.1) | Documented gap; public endpoint is currently unprotected |
| P1 | Input validation with Zod (7.2) | Correctness and security |
| P1 | Onboarding + T&C acceptance (3.5, 4.4) | Gates consent record creation |
| P1 | Connection requests (2.1) | Core social feature; currently surfacing matches with no action |
| P1 | Settings page (5.3) | Account management baseline |
| P2 | Direct messaging (2.2) | High user value; depends on connections |
| P2 | Notifications (2.3, 2.4) | Engagement and retention |
| P2 | Avatar + extended profile (5.1, 5.2) | Identity and trust |
| P2 | Dark mode + design system (3.1, 3.2) | UX polish |
| P3 | 2FA (1.6) | Security hardening |
| P3 | Admin dashboard + moderation (8.1, 8.2) | Requires user base to be meaningful |
| P3 | Interest autocomplete + taxonomy (6.1) | Match quality improvement |
| P3 | Sentry + analytics (9.1, 9.2) | Observability |
| P3 | Automated testing (9.3) | Engineering quality |
