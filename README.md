# Ketchup Frontend

Next.js 16 App Router frontend for authentication, group workflows, planning UI, and voting.

## Architecture

- `src/app/*`: pages and API routes
- `src/auth.ts`: Auth.js configuration and backend user sync
- `src/proxy.ts`: authenticated route guard
- `src/app/api/[...path]/route.ts`: backend proxy
- `src/features/groups/*`: group domain API/types/models
- `src/lib/api.ts`: frontend API helpers

## Routes

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
- `/api/auth/[...nextauth]`
- `/api/[...path]`

## Local Development

Requirements:
- Node.js 20+
- npm
- reachable backend (`BACKEND_URL`)

```bash
cd ketchup-frontend
npm install
npm run dev
```

App URL:
- `http://localhost:3001`

## Environment Variables

- `BACKEND_URL`
- `BACKEND_INTERNAL_API_KEY`
- `BACKEND_REQUEST_TIMEOUT_MS`
- `AUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXTAUTH_URL` / `AUTH_URL`

## Quality Commands

```bash
npm run lint
npm run build
```

Notes:
- `lint` runs `check:routes` first to block duplicate/rogue root route files.
- Next.js may update `tsconfig.json` during build.
