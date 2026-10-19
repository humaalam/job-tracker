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
- Plain JavaScript. **No TypeScript.**
- Tests: Vitest + Supertest (server), Vitest + React Testing Library (client).
- Deploy target: AWS. Server runs in Docker on EC2 (image in ECR), database on RDS Postgres 17, client on S3 + CloudFront, with `/api/*` routed to EC2 so everything is same-origin.

## Commands

```bash
npm run db:up          # start Postgres (5432) + Adminer (http://localhost:8080, server "db") via Docker
npm run db:down        # stop containers (data kept in the pgdata volume)
docker compose down -v # DESTRUCTIVE: wipes all local DB data; needed to re-run docker/postgres/init scripts
docker exec -it job-tracker-db psql -U jobtracker   # SQL shell
npm run dev:server     # run in server workspace (server package not created yet)
npm run dev:client     # run in client workspace (client package not created yet)
npm test               # tests in all workspaces
```

Run a command in one workspace with `-w server` / `-w client` (e.g. `npm install express -w server`).

## Environment

- One `.env` at the repo root (copied from `.env.example`). Docker Compose reads it, and the server will read it as well. When adding a variable, add it to `.env.example` too.
- Two databases in the same container:
  - `jobtracker` (`DATABASE_URL`) for development
  - `jobtracker_test` (`TEST_DATABASE_URL`) for automated tests only, created by `docker/postgres/init/01-create-test-db.sql`
- Prisma's CLI looks for `.env` next to the server package by default. When Prisma is set up, make sure it loads the **root** `.env`.

## Architecture (planned; see SPEC for full model and endpoints)

- Server request flow: `routes → middleware (requireAuth, zod validate) → controllers (HTTP only) → services (business logic + Prisma) → PostgreSQL`.
- `app.js` builds and exports the Express app without listening, so Supertest can import it. `server.js` only calls `listen`.
- All API routes are under `/api`. Errors use the shape `{ error: { message, details? } }`.
- **Ownership:** every query is scoped to the logged-in user. Interviews, contacts and status history are reached through `application.userId`. Another user's resource returns **404**, not 403.
- **Status changes:** every change goes through one service function that updates `Application.status` and inserts a `StatusChange` row in a single `prisma.$transaction`. This also applies to status changes made via `PATCH /applications/:id`. Dashboard stats (response rate) are computed from `StatusChange`, so never bypass it.
- **Client:**
  - talks to `/api` through a fetch wrapper with `credentials: 'include'`
  - in development, the Vite proxy forwards `/api` to `localhost:4000`
  - server state lives in TanStack Query
  - auth state lives in `AuthContext`
