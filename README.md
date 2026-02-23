# Ketchup Frontend

Next.js 16 (App Router) client for Ketchup.

It handles:
- Google sign-in via Auth.js v5
- authenticated navigation and pages
- server-side API proxying to backend
- group planning, voting, settings, invites, and feedback UI

## Current Architecture

- `src/app/*`: pages and API routes
- `src/auth.ts`: Auth.js config and backend user sync (`/api/auth/google-signin`)
- `src/proxy.ts`: route protection (redirect unauthenticated users)
- `src/app/api/[...path]/route.ts`: backend proxy
  - injects `X-User-Id` from Auth.js session
  - injects `X-Internal-Auth` when configured
  - applies request timeout via `BACKEND_REQUEST_TIMEOUT_MS`
- `src/features/groups/*`: group domain API/types/model helpers
- `src/lib/api.ts`: browser-side API helpers that call frontend `/api/*`

## Routes (Current)

Pages:
- `/`
- `/dashboard`
- `/groups/new`
- `/groups/[id]`
- `/groups/[id]/vote/[roundId]`
- `/groups/[id]/vote/[roundId]/results`
- `/groups/[id]/events/[eventId]/feedback`
- `/invites/[groupId]`
- `/settings`

API:
- `/api/auth/[...nextauth]` (Auth.js)
- `/api/[...path]` (proxy to backend)

## Local Development

Requirements:
- Node.js 20+
- npm
- backend reachable at `BACKEND_URL`

Install and run:

```bash
cd ketchup-frontend
npm install
npm run dev
```

Open:
- `http://localhost:3001`

## Environment Variables

From `.env.example`:
- `BACKEND_URL` (default backend target for proxy)
- `BACKEND_INTERNAL_API_KEY` (forwarded as `X-Internal-Auth`)
- `BACKEND_REQUEST_TIMEOUT_MS` (proxy timeout in ms)

Also required for Google Auth.js sign-in:
- `AUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXTAUTH_URL` / `AUTH_URL` in Docker/local setups

## Quality Commands

```bash
npm run lint
npm run build
```

Notes:
- `lint` runs `check:routes` first to prevent rogue root route artifacts.
- Next.js can update `tsconfig.json` during build (expected behavior in this setup).
