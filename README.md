# Ketchup Frontend

Next.js 16 App Router frontend for authentication, group workflows, planning UI, voting, and post-event feedback. Pairs with `ketchup-backend`.

## What This Repo Owns

- UI pages and client components (`src/app/*`, `src/components/*`, `src/styles/*`)
- Auth.js (NextAuth v5 beta) configuration and backend user sync (`src/auth.ts`)
- Authenticated route guard middleware (`src/proxy.ts`)
- Backend proxy route that injects internal auth and `X-User-Id` headers (`src/app/api/[...path]/route.ts`)
- Group domain API/types/models (`src/features/groups/*`)
- Frontend API helpers (`src/lib/api.ts`)
- Cloud Run deploy workflow (`.github/workflows/deploy-frontend.yml`)
- Production container image (`Dockerfile`, Next.js `output: "standalone"`)

---

## Setup

### Prerequisites

- Node.js 20+
- npm
- A reachable backend (`BACKEND_URL`) — run `ketchup-backend` locally or point at a deployed Cloud Run URL.
- A `.env.local` at the repo root (see below). `.env.example` contains the minimal backend-facing variables.

### 1) Create `.env.local`

Create `ketchup-frontend/.env.local` with the following (fill in OAuth/internal secrets as needed):

```bash
# Backend proxy target
BACKEND_URL=http://localhost:8000
BACKEND_INTERNAL_API_KEY=dev-internal-key-change-me
BACKEND_REQUEST_TIMEOUT_MS=360000

# Auth.js / NextAuth
AUTH_SECRET=generate-with-"npx auth secret"
AUTH_URL=http://localhost:3001
AUTH_TRUST_HOST=true

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

`BACKEND_INTERNAL_API_KEY` must match the backend's value — the API proxy sends it as `X-Internal-Auth` on every outbound request.

### 2) Install and run the dev server

```bash
cd ketchup-frontend
npm install
npm run dev
```

App URL: <http://localhost:3001>

### 3) Production build locally

```bash
npm run build
npm start
```

### 4) Container build

The `Dockerfile` produces a Next.js standalone image that listens on port 3000 (Cloud Run-compatible):

```bash
docker build -t ketchup-frontend .
docker run --rm -p 3000:3000 --env-file .env.local ketchup-frontend
```

---

## Architecture

### Directory layout

- `src/app/*` — App Router pages and API route handlers
- `src/auth.ts` — Auth.js setup (Google provider, JWT callback syncs user to backend, session callback attaches `user.id`)
- `src/proxy.ts` — NextAuth-wrapped middleware; redirects unauthenticated users to `/` and logged-in users hitting `/` to `/dashboard`
- `src/app/api/[...path]/route.ts` — catch-all backend proxy for `GET/POST/PUT/DELETE`; forwards query string, body, and injects `X-Internal-Auth` + `X-User-Id` headers; 502s on backend failure
- `src/features/groups/*` — typed client for the groups domain (`api.ts`, `model.ts`, `types.ts`)
- `src/lib/api.ts` — shared fetch helpers
- `src/components/AppShellNav.tsx` — top-level Mantine `AppShell` navigation
- `scripts/check-route-ownership.mjs` — lint-time guard that blocks rogue `page.*` files at `src/app/` root and enforces the canonical `src/app/page.tsx`

### Auth flow

1. User signs in via Google through Auth.js at `/api/auth/[...nextauth]`.
2. In the `jwt` callback, the frontend POSTs `{ email, name, google_id }` to `${BACKEND_URL}/api/auth/google-signin`.
3. Backend returns a `user_id`, which is placed on the JWT and promoted to `session.user.id` in the `session` callback.
4. Authenticated API calls go through the proxy route, which attaches `X-User-Id: <session.user.id>` so the backend can identify the caller.

### Routes

Pages:

- `/` — signed-out landing / sign-in
- `/dashboard` — authenticated home
- `/groups/new`
- `/groups/[id]`
- `/groups/[id]/vote/[roundId]`
- `/groups/[id]/vote/[roundId]/results`
- `/groups/[id]/events/[eventId]/feedback`
- `/invites/[groupId]`
- `/settings`

API routes:

- `/api/auth/[...nextauth]` — Auth.js handlers
- `/api/[...path]` — backend proxy (any path starting with `auth/` returns 404 so the NextAuth handler above is not shadowed)

---

## Environment Variables

Backend proxy:

- `BACKEND_URL` — upstream backend origin (default `http://localhost:8000`)
- `BACKEND_INTERNAL_API_KEY` — sent as `X-Internal-Auth`; must match backend's `BACKEND_INTERNAL_API_KEY`
- `BACKEND_REQUEST_TIMEOUT_MS` — proxy `AbortSignal.timeout` in ms (default `360000`)

Auth.js / NextAuth:

- `AUTH_SECRET` — JWT signing secret (`npx auth secret` to generate)
- `AUTH_URL` (or legacy `NEXTAUTH_URL`) — public origin used to build callback URIs
- `AUTH_TRUST_HOST=true` — required behind Cloud Run / any proxy

Google OAuth:

- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — from Google Cloud Console OAuth 2.0 client; add `${AUTH_URL}/api/auth/callback/google` as an authorized redirect URI for both dev and prod origins.

---

## Quality Commands

```bash
npm run lint   # runs check:routes, then eslint .
npm run build  # next build (also runs TypeScript type-check)
```

Notes:

- `check:routes` blocks duplicate/rogue root route files under `src/app/` and asserts `src/app/page.tsx` exists.
- Next.js may update `tsconfig.json` on first build (adds App Router / plugin entries) — commit the changes.

---

## GitHub Workflows

### `deploy-frontend.yml` — Deploy Frontend to GCP

**Triggers:** push to `main` or `staging` (skips doc-only changes via `paths-ignore: **.md`), or manual `workflow_dispatch` with an optional `environment` override (`dev` / `prod`).

**Environment resolution:** `main` → `prod`, `staging` → `dev`, dispatch input wins when set.

**Job — `build-and-deploy`:**

1. Authenticates to GCP via `GCP_SA_KEY`.
2. Ensures an Artifact Registry repo `ketchup-frontend-${env}` exists.
3. Builds and pushes the image tagged with both `:${sha}` and `:latest`.
4. Looks up the sibling backend service URL (`ketchup-backend-${env}`) on Cloud Run and passes it as `BACKEND_URL` to the frontend service.
5. `gcloud run deploy` with: port 3000, 1 CPU, 512Mi, min 0 / max 3 instances, public (`--allow-unauthenticated`).
6. Sets `AUTH_URL` to the service URL after deploy so NextAuth generates correct callback URIs.
7. Updates the backend's `FRONTEND_URL` env var to point at the freshly deployed frontend (keeps CORS / shared-cookie configs in sync).
8. Writes a deployment summary (env, frontend URL, image) to the job summary.

**Required repo variables:** `GCP_PROJECT_ID`, `GCP_REGION`.

**Required repo secrets:** `GCP_SA_KEY`, `BACKEND_INTERNAL_API_KEY`, `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.

### Typical Deployment Flow

1. Push to `staging` → `deploy-frontend.yml` builds + deploys frontend to `dev`, wires it to `ketchup-backend-dev`, and updates the backend's `FRONTEND_URL`.
2. Merge/push to `main` → same, but to `prod`.
3. If the backend moves to a new Cloud Run URL, rerun the frontend deploy so step 4 above re-discovers `BACKEND_URL`.

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| `redirect_uri_mismatch` from Google | `AUTH_URL` differs from Google Console's authorized redirect URI | set `AUTH_URL` to the exact public origin and add `${AUTH_URL}/api/auth/callback/google` in Google Cloud Console |
| All `/api/*` calls return 502 `Backend unavailable` | `BACKEND_URL` unreachable from the frontend container | verify the backend is running and, in Docker, use `host.docker.internal` or a resolvable service name instead of `localhost` |
| Backend returns 401 on proxied calls | `BACKEND_INTERNAL_API_KEY` mismatch | make sure both services share the same value |
| Session has no `user.id` | backend `/api/auth/google-signin` failed during `jwt` callback | check backend logs; the frontend logs `Backend user sync failed:` on error |
| `NextAuth` warnings about host behind proxy | missing `AUTH_TRUST_HOST` | set `AUTH_TRUST_HOST=true` (already set by the deploy workflow) |
| `lint` fails on `check:routes` | a stray `page.jsx` / `page.ts` at `src/app/` root | keep only `src/app/page.tsx`; move other root files into subroutes |
| Build output too large / missing `server.js` in Docker | `output: "standalone"` removed from `next.config.mjs` | keep `output: "standalone"` — the Dockerfile copies `.next/standalone/server.js` |

---

## Related Repos

- `ketchup-backend` — FastAPI backend, planner, data/model pipelines, Terraform, Cloud Run infra.
