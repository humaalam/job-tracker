# Job Application Tracker

A full-stack app for tracking job applications: statuses with history, interviews, contacts, a Kanban board and a stats dashboard.

**Stack:** React + Vite (client) · Node + Express (server) · PostgreSQL + Prisma · Docker · AWS

See [docs/SPEC.md](docs/SPEC.md) for the full spec, data model, API and build plan.

## Project structure

```
job-tracker/
├── client/   # React frontend (Vite)
├── server/   # Express API (Prisma + PostgreSQL)
├── docker/   # Files used by Docker containers (DB init scripts)
├── docs/     # Spec and documentation
└── deploy/   # AWS deployment notes and scripts
```

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

## Scripts

| Command | What it does |
|---|---|
| `npm run db:up` / `db:down` | Start / stop the local PostgreSQL container |
| `npm run db:migrate -w server` | Apply/create migrations, then regenerate the Prisma client (add `-- --name <name>` for a new migration) |
| `npm run db:generate -w server` | Regenerate the Prisma client only |
| `npm run db:seed -w server` | Reset the demo account's data (`demo@example.com` / `password123`) |
| `npm run db:studio -w server` | Open Prisma Studio (browse/edit data) at http://localhost:5555 |
| `npm run dev:server` | Start the API in watch mode |
| `npm run dev:client` | Start the React dev server at http://localhost:5173 (proxies `/api` to the API) |
| `npm run build -w client` | Build the React app for production into `client/dist` |
| `npm test` | Run tests in all workspaces |

## Deployment

_Coming in Phase 12 (AWS)._
