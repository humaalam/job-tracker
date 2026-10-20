# Job Application Tracker

A full-stack app for tracking job applications: statuses with history, interviews, contacts, a Kanban board and a stats dashboard.

**Stack:** React + Vite (client) · Node + Express (server) · PostgreSQL + Prisma · Docker · AWS

See [docs/SPEC.md](docs/SPEC.md) for the full spec, data model, API and build plan.

## Features

- **Accounts:** register, log in and log out. The session is a JWT in an httpOnly cookie, and every user only ever sees their own data.
- **Applications:** create, edit and delete them, with company, role, status, salary range, work mode, links and notes. The list has search, status and work mode filters, sorting and pages, and all of it is kept in the URL.
- **Kanban board:** drag cards (or move them with the keyboard) between status columns. The card moves at once and goes back if saving fails.
- **Status history:** every status change is recorded and shown as a timeline on the detail page.
- **Interviews and contacts:** for each application, on its detail page.
- **Dashboard:** totals, response rate, counts per status, a chart of applications per week (in your time zone) and the interviews of the next 7 days.
- **CSV export:** of the applications list, with the filters and sorting you are looking at. It opens correctly in Excel.

## Project structure

```
job-tracker/
├── client/   # React frontend (Vite)
├── server/   # Express API (Prisma + PostgreSQL)
├── docker/   # Files used by Docker containers (DB init scripts)
├── docs/     # Spec and documentation
└── deploy/   # AWS deployment notes and scripts (Phase 12)
```

The server is organised as `routes → middleware → controllers → services → Prisma`, and the client as `api/` (fetch calls) → `hooks/` (TanStack Query) → `components/` and `pages/`. See [CLAUDE.md](CLAUDE.md) and the spec for details.

## Prerequisites

- Node.js 22.18+ (24 recommended; needed to run the generated Prisma client)
- Docker Desktop

## Getting started

```bash
cp .env.example .env            # then edit values if needed
npm install
npm run db:up                   # start PostgreSQL + Adminer in Docker
npm run db:migrate -w server    # apply migrations and generate the Prisma client
npm run db:seed -w server       # optional: demo data
```

The seed creates a demo account (`demo@example.com` / `password123`) with 11 sample applications. Re-running it resets only the demo account's data.

Browse the database at http://localhost:8080 (Adminer). Log in with:

- System: PostgreSQL
- Server: `db`
- Username, password and database: the values from your `.env`

The init scripts in `docker/postgres/init/` only run on a **fresh** volume. To re-run them, reset the database with `docker compose down -v`. This deletes all local data.

### Running the app

Run these in two terminals:

```bash
npm run dev:server   # API on http://localhost:4000
npm run dev:client   # React app on http://localhost:5173
```

Open http://localhost:5173. The Vite dev server forwards every `/api` request to the API on port 4000, so the browser only ever talks to one address.

## Environment variables

All of them live in one `.env` file at the repo root (copy `.env.example`). Docker Compose and the server both read it.

| Variable                                                             | Used for                                                                   |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT` | The local PostgreSQL container                                             |
| `ADMINER_PORT`                                                       | The database web UI (default 8080)                                         |
| `NODE_ENV`, `PORT`                                                   | Server mode and port (default 4000)                                        |
| `DATABASE_URL`                                                       | The development database                                                   |
| `TEST_DATABASE_URL`                                                  | A separate database that the tests wipe and refill                         |
| `JWT_SECRET`, `JWT_EXPIRES_IN`                                       | Signing login tokens (use a long random secret) and how long a login lasts |
| `CLIENT_ORIGIN`                                                      | The frontend's address, allowed by CORS                                    |

## Testing

```bash
npm test                 # everything
npm test -w server       # API tests (Vitest + Supertest)
npm test -w client       # component tests (Vitest + React Testing Library)
```

- **Server tests** call the real API against the `jobtracker_test` database, so Docker must be running (`npm run db:up`). They cover auth, CRUD, ownership (user B can't see user A's data), status history, the dashboard math and the CSV export.
- **Client tests** run in jsdom (a browser imitation in Node) with the API mocked, so they need no server. They cover the forms, the filter bar, the Kanban status change (including the rollback when saving fails) and the dashboard's loading, error and empty states.

Add `npm run test:watch -w server` (or `-w client`) to re-run tests whenever a file changes.

## Code quality

```bash
npm run lint             # ESLint: likely bugs, React hooks rules
npm run lint:fix         # ...and fix what can be fixed automatically
npm run format           # Prettier: format every file
npm run format:check     # only check (e.g. in CI)
```

There's one config for the whole repo: `eslint.config.js`, `.prettierrc.json` and `.prettierignore`. ESLint doesn't check formatting (`eslint-config-prettier`), so the two tools never disagree. `.gitattributes` keeps LF line endings on every OS.

## Scripts

| Command                           | What it does                                                                                            |
| --------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `npm run db:up` / `db:down`       | Start / stop the local PostgreSQL container                                                             |
| `npm run db:migrate -w server`    | Apply/create migrations, then regenerate the Prisma client (add `-- --name <name>` for a new migration) |
| `npm run db:generate -w server`   | Regenerate the Prisma client only                                                                       |
| `npm run db:seed -w server`       | Reset the demo account's data (`demo@example.com` / `password123`)                                      |
| `npm run db:studio -w server`     | Open Prisma Studio (browse/edit data) at http://localhost:5555                                          |
| `npm run dev:server`              | Start the API in watch mode                                                                             |
| `npm run dev:client`              | Start the React dev server at http://localhost:5173 (proxies `/api` to the API)                         |
| `npm run build -w client`         | Build the React app for production into `client/dist`                                                   |
| `npm test`                        | Run tests in all workspaces                                                                             |
| `npm run lint` / `lint:fix`       | Check (and fix) the code with ESLint                                                                    |
| `npm run format` / `format:check` | Format (or check) every file with Prettier                                                              |

## Troubleshooting

- **"Could not reach the server" in the app:** the API isn't running. Start it with `npm run dev:server`.
- **Server tests fail to connect:** start the database (`npm run db:up`). If `jobtracker_test` is missing, the volume was created before the init script existed: run `docker compose down -v` (wipes local data), then `npm run db:up`.
- **`Cannot find module '../generated/prisma/client.ts'`:** generate the Prisma client with `npm run db:generate -w server`.

## Deployment

_Coming in Phase 12 (AWS): Docker on EC2, RDS PostgreSQL, S3 + CloudFront._
