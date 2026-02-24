# Movie Memory

Movie Memory is a Next.js full-stack app where a signed-in user stores a favorite movie and generates movie-specific facts.

## Live App

- Production: https://movie-memory-app-ivory.vercel.app

## Stack

- Next.js (App Router)
- TypeScript
- NextAuth (Google OAuth)
- Prisma + PostgreSQL
- OpenAI Chat Completions API
- Vitest

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables in `.env`:

```env
DATABASE_URL=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
OPENAI_API_KEY=...
```

For production (Vercel), set:

```env
NEXTAUTH_URL=https://movie-memory-app-ivory.vercel.app
```

3. Run Prisma migration/generate if needed:

```bash
npx prisma migrate dev
npx prisma generate
```

4. Start development server:

```bash
npm run dev
```

## Variant B Notes (Frontend/API Focus)

### 1) Typed API Layer

Implemented endpoints:

- `GET /api/me`
- `PUT /api/me/movie`
- `GET /api/fact`

Typed client wrapper: `src/lib/api.ts`

- Single `request()` helper for consistent fetch behavior
- Runtime response parsing into typed DTOs
- Normalized `ApiClientError` for HTTP error handling (`status` + message)

### 2) Edit Movie Flow (Inline)

Dashboard inline edit supports:

- `Save` + `Cancel`
- Optimistic UI update
- Rollback on server failure

Files:

- `src/app/_components/favorite-card.tsx`
- `src/lib/movie-edit.ts`

### 3) Client-Side Caching Strategy

Chosen approach: **custom React state** (no SWR/React Query).

Why:

- Requirement is small and local to one dashboard flow
- Keeps behavior explicit for take-home review
- Avoids extra dependency/config overhead

Behavior:

- Cache stores last fact + timestamp + movie key
- TTL is 30 seconds
- `Get Fact` reuses cache within TTL
- `Force New Fact` bypasses cache
- Cache invalidates when favorite movie changes

File:

- `src/app/_components/dashboard-client.tsx`

### 4) Minimal Tests

- API client error handling: `src/lib/api.test.ts` (401 and 500 normalization)
- Movie edit behavior: `src/lib/movie-edit.test.ts` (optimistic update, revert, cancel, success)

Run tests:

```bash
npm test
```

## Security & Correctness

- Server-side movie validation in `src/lib/movie.ts`
- Auth checks on protected API routes via NextAuth session
- User-scoped queries/updates (no cross-user access)
- Secrets remain server-side (`OPENAI_API_KEY` only used in API route/lib)
- Graceful fallback for missing Google name/photo in dashboard UI
