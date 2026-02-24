# Movie Memory

Movie Memory is a full-stack Next.js application where users sign in with Google, set a favorite movie, and generate movie-specific facts.

## 1) GitHub Repository

- Repository: https://github.com/Sriyakreddy/movie-memory
- Live App (Vercel): https://movie-memory-app-ivory.vercel.app

## Submission Checklist

- [x] GitHub repository link included
- [x] Setup instructions included
- [x] Required environment variables listed
- [x] Database migration steps documented
- [x] Architecture overview provided
- [x] Variant selected and justified
- [x] Key tradeoffs listed
- [x] 2-hour improvement plan listed
- [x] AI usage note included
- [ ] Optional walkthrough video link (add if recorded)

## 2) Setup Instructions

### Prerequisites

- Node.js 20+
- npm
- PostgreSQL database (Neon or local Postgres)
- Google Cloud OAuth credentials
- OpenAI API key

### Install and Run

```bash
npm install
npx prisma migrate dev
npx prisma generate
npm run dev
```

App runs at `http://localhost:3000`.

## 3) Required Environment Variables

Create `.env` in project root:

```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=your_long_random_secret
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
OPENAI_API_KEY=your_openai_api_key
```

Production (Vercel) values:

- `NEXTAUTH_URL=https://movie-memory-app-ivory.vercel.app`
- keep all other variables configured in Vercel Project Settings -> Environment Variables.

## 4) Database Migration Steps

Local development:

```bash
npx prisma migrate dev
npx prisma generate
```

Production (recommended build command in Vercel):

```bash
prisma migrate deploy && next build
```

## 5) Architecture Overview (Variant B)

### High-level design

The app uses a server-rendered Next.js App Router architecture with client-side orchestration for Variant B behavior.

- UI and pages: `src/app`
- Typed client and domain logic: `src/lib`
- Database schema and migrations: `prisma`

Authentication is implemented with NextAuth + Google OAuth and Prisma adapter for persisted sessions.

### Data model rationale

Core Prisma models:

- `User`: profile identity from Google and app state (`favoriteMovie`, `createdAt`)
- `Fact`: generated fact text, linked to `User`, scoped by movie
- `Account`, `Session`, `VerificationToken`: standard NextAuth persistence models

Why this schema:

- Keeps authentication concerns and app data separated but linked via `User`
- Supports per-user authorization checks on every API route
- Supports fact history while allowing movie-scoped filtering and cache behavior

### API contracts (typed)

Variant B endpoints:

- `GET /api/me`
- `PUT /api/me/movie`
- `GET /api/fact`

Typed client wrapper: `src/lib/api.ts`

- One request utility for consistent headers and JSON handling
- Runtime parsing and DTO shape checks
- Normalized `ApiClientError` with status + message

### Frontend state strategy (client orchestration)

Main orchestration lives in `src/app/_components/dashboard-client.tsx`.

- Loads user state through typed API client
- Handles inline movie edit result updates
- Maintains simple in-memory fact cache:
  - cache key = current movie
  - value = latest fact + timestamp
  - TTL = 30 seconds
- Supports explicit bypass with `Force New Fact`
- Clears cached/latest fact when favorite movie changes

Why this approach:

- Small scope and easy reasoning for assessment
- No additional state libraries required
- Straightforward to explain optimistic and failure flows

### Error handling and failure cases

- API routes return structured `{ error }` with meaningful status codes
- Client converts non-OK responses into `ApiClientError`
- Movie save flow uses optimistic update and rolls back if request fails
- Fact generation surfaces server-side errors without exposing secrets

### Security and authorization

- Session checks in protected API routes via `getServerSession`
- User scope enforced by session email -> user lookup on server
- No user-id trust from client payloads
- Server-side input validation for movie values (`src/lib/movie.ts`)
- Secrets remain server-side (OpenAI/Google credentials not exposed in client code)

## 6) Variant Chosen and Why

Chosen variant: **Variant B — Frontend/API-Focused (Client Orchestration)**.

Why:

- Focuses on typed contracts, client state, and failure handling
- Best aligned with practical frontend full-stack expectations
- Lets us demonstrate clear reasoning around caching and optimistic UI

## 7) Key Tradeoffs

- Kept caching in component state instead of adding SWR/React Query:
  - Pro: lower complexity, easier interview explanation
  - Con: cache is page-session scoped (not shared globally)
- Used a latest-fact-focused UI for clarity:
  - Pro: less noise and simpler behavior around invalidation
  - Con: reduced in-app historical browsing depth
- Prisma + NextAuth DB sessions over JWT-only setup:
  - Pro: explicit server-side control and consistency
  - Con: requires stable database configuration in all environments

## 8) What I Would Improve with 2 More Hours

1. Add route-level integration tests for `/api/me`, `/api/me/movie`, and `/api/fact`.
2. Add optimistic UI telemetry/notifications and clearer retry affordances.
3. Add admin/debug page for viewing users and sign-in events (protected).
4. Improve observability (structured logs + error IDs surfaced in UI).
5. Add lightweight rate limiting on fact generation endpoint.

## 9) Tests Added (Variant B requirements)

- `src/lib/api.test.ts`
  - verifies API client error normalization for 401 and 500 responses
- `src/lib/movie-edit.test.ts`
  - verifies optimistic movie edit behavior
  - verifies rollback on failure
  - verifies success state update and cancel behavior

Run tests:

```bash
npm test
```

## 10) AI Usage Notes

- Used AI to accelerate refactoring and API/client consistency checks.
- Used AI to draft and refine prompt rules for movie-specific fact generation.
- Used AI for iterative UI text cleanup and route consolidation decisions.
- All code paths were manually validated through lint/tests/build and runtime checks.

## Optional (Encouraged)

- A 3–5 minute walkthrough video can explain:
  - auth flow
  - typed API contracts
  - optimistic edit + rollback
  - 30-second cache behavior and invalidation

## Walkthrough Script (Simple)

### 30-second intro

Hi, this is my Variant B submission for the full-stack take-home.  
I built Movie Memory using Next.js, TypeScript, NextAuth, Prisma, PostgreSQL, and OpenAI.  
This project focuses on typed API contracts, client-side orchestration, inline editing with rollback, and 30-second fact caching with invalidation on movie change.

### 3–5 minute flow (what to show)

1. Show repo structure: `src/app`, `src/lib`, `prisma/schema.prisma`.
2. Show Google sign-in and redirect to dashboard.
3. Show inline edit on dashboard:
   - edit movie
   - save
   - cancel behavior
   - mention optimistic update + rollback on failure.
4. Show facts section:
   - `Get Fact`
   - `Force New Fact`
   - explain 30-second reuse and invalidation when movie changes.
5. Show typed client and APIs:
   - `src/lib/api.ts`
   - `/api/me`, `/api/me/movie`, `/api/fact`.
6. Show tests:
   - `src/lib/api.test.ts`
   - `src/lib/movie-edit.test.ts`.
7. Close with tradeoffs and next improvements.

### 30-second closing

In summary, I prioritized correctness and explainability over unnecessary complexity.  
I implemented typed API contracts, secure auth-based scoping, robust error handling, and clear frontend state transitions.  
If I had more time, I would add integration tests, better observability, and stronger production safeguards like endpoint rate limiting.

## Secret Safety Note

- Real secrets are not committed to this repository.
- `.env*` files are gitignored by `.gitignore`.
- Only placeholder values are shown in this README.
- Production secrets are configured in Vercel Environment Variables.
