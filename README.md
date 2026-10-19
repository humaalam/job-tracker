# Job Application Tracker

A full-stack app for tracking job applications: statuses with history, interviews, contacts, a Kanban board and a stats dashboard.

**Stack:** React + Vite (client) · Node + Express (server) · PostgreSQL + Prisma · Docker · AWS

See [docs/SPEC.md](docs/SPEC.md) for the full spec, data model, API and build plan.

## Project structure

```
job-tracker/
├── client/   # React frontend (Vite)
├── server/   # Express API (Prisma + PostgreSQL)
├── docs/     # Spec and documentation
└── deploy/   # AWS deployment notes and scripts
```

## Prerequisites

- Node.js 22+
- Docker Desktop

## Getting started

```bash
cp .env.example .env    # then edit values if needed
npm install
npm run db:up           # start PostgreSQL in Docker
```

_More steps (migrations, running the apps) will be added as the project grows._

## Scripts

| Command | What it does |
|---|---|
| `npm run db:up` / `db:down` | Start / stop the local PostgreSQL container |
| `npm run dev:server` | Start the API in watch mode |
| `npm run dev:client` | Start the React dev server |
| `npm test` | Run tests in all workspaces |

## Deployment

_Coming in Phase 12 (AWS)._
