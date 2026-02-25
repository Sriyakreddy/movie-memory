# Movie Memory

Movie Memory is a full-stack web app where users sign in with Google, set a favorite movie, and fetch movie-specific facts.

- GitHub: https://github.com/Sriyakreddy/movie-memory
- Live app: https://movie-memory-app-ivory.vercel.app

## Setup Instructions

### Prerequisites

- Node.js 20+
- npm
- PostgreSQL database (Neon or local)
- Google OAuth credentials
- OpenAI API key

### Run Locally

```bash
npm install
npx prisma migrate dev
npx prisma generate
npm run dev
````

Open `http://localhost:3000`.

## Required Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=your_long_random_secret
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
OPENAI_API_KEY=your_openai_api_key
```

For production:

- Set `NEXTAUTH_URL` to your deployed domain
- Configure all variables in your hosting environment

## Database Migration Steps

### Local

```bash
npx prisma migrate dev
npx prisma generate
```

### Production

Use this in your production build pipeline:

```bash
prisma migrate deploy && next build
```

## Architecture Overview

This app uses Next.js App Router with server-side rendering for protected pages and client-side state management for dashboard interactions.

### Main layers

- `src/app`: routes, API handlers, and UI components
- `src/lib`: typed API client, validation, auth config, and domain logic
- `prisma`: schema and migrations

### Authentication and data flow

- Google sign-in is implemented with NextAuth
- NextAuth uses Prisma adapter to persist users, sessions, and linked accounts
- Protected API routes use `getServerSession` to enforce authentication

### Data model

Core models in Prisma:

- `User`: identity and app state (favorite movie)
- `Fact`: generated movie facts linked to a user
- `Account`, `Session`, `VerificationToken`: standard NextAuth models

Why this model:

- user-scoped ownership is explicit
- auth data and app data are cleanly connected
- fact history is preserved while still supporting movie-specific filtering

### Variant B API contracts

Implemented endpoints:

- `GET /api/me`
- `PUT /api/me/movie`
- `GET /api/fact`

Typed client wrapper:

- `src/lib/api.ts`
- centralizes request handling
- parses response shapes
- normalizes API errors through `ApiClientError`

### Frontend state and caching strategy

Dashboard orchestration is in `src/app/_components/dashboard-client.tsx`.

- inline favorite movie edit flow
- optimistic save with rollback on server error
- 30-second client cache for movie facts
- explicit force refresh path
- cache invalidation when favorite movie changes

I intentionally used React state for this scope instead of adding React Query/SWR. It kept behavior easy to reason about and easy to explain.

### Security and correctness

- favorite movie input is validated on the server (`src/lib/movie.ts`)
- APIs use session checks and user-scoped queries
- no cross-user updates are allowed
- secrets stay on the server (not exposed to client code)
- UI handles missing Google name/photo gracefully

## Variant Chosen and Why

I chose **Variant B (Frontend/API-focused client orchestration)**.

Reason:

- strongest fit for typed contracts + frontend state reasoning
- allowed me to demonstrate optimistic UI, rollback, and cache invalidation behavior clearly

## Key Tradeoffs

1. I used local React state instead of React Query/SWR.
2. I kept Dashboard, Favorite, and Facts as sections in one dashboard page instead of separate routes.
3. I prioritized clear flow and reliability over adding more features.

## What I Would Improve with 2 More Hours

1. Add API integration tests for `/api/me`, `/api/me/movie`, and `/api/fact`.
2. Add structured logging and better operational error visibility.
3. Add lightweight rate limiting on fact generation.
4. Add a simple retry UX for temporary fact generation failures.

## AI Usage Notes

- Used AI to speed up refactoring and cleanup of frontend/API structure.
- Used AI to review edge cases around optimistic updates and cache invalidation.
- Used AI to improve README clarity and walkthrough preparation.
- Final behavior was verified manually with lint, tests, and runtime checks.

## Tests

- `src/lib/api.test.ts`: API client error handling (401 and 500 paths)
- `src/lib/movie-edit.test.ts`: optimistic edit flow, rollback, save, and cancel behavior

Run tests:

```bash
npm test
```
