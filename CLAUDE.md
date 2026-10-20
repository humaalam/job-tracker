# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Full-stack Job Application Tracker, built as a **learning project** (the owner is learning Claude Code and the stack). `docs/SPEC.md` is the source of truth for requirements, data model, API endpoints and the phased build plan. Read the relevant section before starting a step, and update the spec when a decision changes.

## Working agreement (important)

- Work through `docs/SPEC.md` **one step at a time**, in order. Don't jump ahead or bundle steps.
- After each step, explain what was done and why. Explain every new or changed file **line by line** in simple words. Introduce new concepts in plain language and name one alternative.
- End each step with a suggested commit message (conventional style: `docs:`, `chore:`, `feat:`, ...), then **stop and wait** for the user. The user commits and pushes themselves.
- Ask clarifying questions one at a time.

## Stack (decided; see SPEC for rationale)

- npm workspaces monorepo: `client/` (React + Vite, React Router, TanStack Query, Tailwind, @dnd-kit, Recharts) and `server/` (Express, Prisma, PostgreSQL, zod, bcrypt, JWT in an httpOnly cookie).
- Plain JavaScript. **No TypeScript.** Only exception: Prisma 7's `prisma-client` generator writes the client as `.ts` into `server/src/generated/prisma/` (gitignored, never edited). Node runs it via type stripping; our code imports `../generated/prisma/client.ts` only from `server/src/db/prisma.js`.
- Prisma is pinned to stable **7.x** (`^7.10.1`). npm's `latest` tag points to an 8.0 release candidate, so don't install unpinned.
- Tests: Vitest + Supertest (server), Vitest + React Testing Library (client).
- Deploy target: AWS. Server runs in Docker on EC2 (image in ECR), database on RDS Postgres 17, client on S3 + CloudFront, with `/api/*` routed to EC2 so everything is same-origin.

## Commands

```bash
npm run db:up          # start Postgres (5432) + Adminer (http://localhost:8080, server "db") via Docker
npm run db:down        # stop containers (data kept in the pgdata volume)
docker compose down -v # DESTRUCTIVE: wipes all local DB data; needed to re-run docker/postgres/init scripts
docker exec -it job-tracker-db psql -U jobtracker   # SQL shell
npm run db:migrate -w server                        # apply/create migrations, then prisma generate (postdb:migrate hook)
npm run db:migrate -w server -- --name <change>     # create a new migration non-interactively
npm run db:generate -w server                       # regenerate the Prisma client only
npm run db:studio -w server                         # Prisma Studio at http://localhost:5555
npm run db:seed -w server                           # re-runnable; resets only demo@example.com / password123
npm run dev:server     # API on http://localhost:4000 (node --watch)
npm run dev:client     # React app on http://localhost:5173 (Vite); /api is proxied to :4000, so run dev:server too
npm run build -w client                             # production build into client/dist (gitignored)
npm test               # tests in all workspaces
npm test -w server     # server tests (Vitest); migrates jobtracker_test first (tests/globalSetup.js)
npm run test:watch -w server                        # re-run tests on file change
npm test -w client     # component tests (Vitest + jsdom + React Testing Library), no server or DB needed
npx vitest run src/test/FilterBar.test.jsx          # (from client/) run one test file; add -t "<name>" for one test
```

Run a command in one workspace with `-w server` / `-w client` (e.g. `npm install express -w server`).

## Environment

- One `.env` at the repo root (copied from `.env.example`). Docker Compose reads it, and the server will read it as well. When adding a variable, add it to `.env.example` too.
- Two databases in the same container:
  - `jobtracker` (`DATABASE_URL`) for development
  - `jobtracker_test` (`TEST_DATABASE_URL`) for automated tests only, created by `docker/postgres/init/01-create-test-db.sql`
- `server/src/config/env.js` loads the **root** `.env` (with `process.loadEnvFile`, only if the file exists) and validates variables. Prisma 7 doesn't load `.env` itself, so `server/prisma.config.js` imports this config. Add new variables to `config` there.
- Prisma 7 notes: the DB URL lives in `prisma.config.js` (not the schema); the client needs the `@prisma/adapter-pg` adapter; `migrate dev` no longer runs `generate`, hence the `postdb:migrate` hook. The PG adapter ignores `?schema=` in the URL (we use `public`).

## Architecture (planned; see SPEC for full model and endpoints)

- Server request flow: `routes → middleware (requireAuth, zod validate) → controllers (HTTP only) → services (business logic + Prisma) → PostgreSQL`.
- `app.js` builds and exports the Express app without listening, so Supertest can import it. `server.js` only calls `listen`.
- All API routes are under `/api`. Errors use the shape `{ error: { message, details? } }`.
- **Ownership:** every query is scoped to the logged-in user. Interviews, contacts and status history are reached through `application.userId`. Another user's resource returns **404**, not 403.
- **Status changes:** every change goes through one service function that updates `Application.status` and inserts a `StatusChange` row in a single `prisma.$transaction`. This also applies to status changes made via `PATCH /applications/:id`. Dashboard stats (response rate) are computed from `StatusChange`, so never bypass it. Only exception: `server/prisma/seed.js` writes backdated history directly, and it must keep `status` = the last history entry and set `appliedAt` = the APPLIED step.
- **Client:**
  - talks to `/api` only through the fetch wrapper `client/src/api/client.js` (`credentials: 'include'`); failures throw `ApiError` (`message`, `status`, `details`)
  - layers: `api/<resource>.js` (plain calls) → `hooks/use<Thing>.js` (TanStack Query) → components
  - in development, the Vite proxy forwards `/api` to `localhost:4000`
  - server state lives in TanStack Query
  - auth state lives in `AuthContext` (`useAuth()`), backed by the `['auth','me']` query. Don't `navigate()` after login/logout: `ProtectedRoute` / `GuestLayout` redirect from the auth state (see SPEC, Phase 6 Step 4)
