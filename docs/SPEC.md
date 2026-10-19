# Job Application Tracker: Spec & Learning Plan

## Context
This is a new full-stack app in an empty repo (`d:\job-tracker`). **Main goal: learn Claude Code and the technologies in the stack** by building a real app step by step.

The app lets users sign up, track job applications through a fixed status pipeline, record interviews, contacts, job details and notes, and see a basic stats dashboard. The last phase deploys it to AWS.

**First action after approval:** save this plan as `docs/SPEC.md`. It becomes the project's spec and is kept up to date as we go.

### How we'll work
- The work is split into small **phases**, and each phase into small **steps**.
- We do **one step at a time**. After each step I explain **what I did and why** (files touched, concepts involved). Then I **stop and wait for you** before the next step.
- At the end of each step I suggest a git commit, so the history follows the learning path.
- If a step teaches a new concept (e.g. a migration or a middleware), I give a short explanation in plain words before writing the code.

### Agreed requirements
- **Users:** multi-user, email + password login. Each user only sees their own data.
- **Per application:**
  - basics: company, role, status, applied date
  - job details: URL, location, work mode, salary range, description
  - notes, plus resume/cover letter *version labels* (no file uploads)
- **Contacts:** each contact belongs to one application.
- **Interviews/events:** many per application (type, date/time, outcome, notes).
- **Statuses:** fixed list `WISHLIST → APPLIED → INTERVIEWING → OFFER → REJECTED / WITHDRAWN`. Every change is logged with a timestamp.
- **Company:** a plain text field on the application.
- **Views:** a table (sort, filter, search) and a Kanban board (drag a card to change its status), with a toggle between them.
- **Dashboard:** counts per status, applications per week, response rate, interviews in the next 7 days.
- **Extras:** Docker Compose for local Postgres, automated tests, CSV export, AWS deployment.
- **Out of scope for v1:** OAuth, password reset, file uploads, a companies table, custom statuses.

---

## Technologies: what, why, and one alternative

### General
| Technology | What it is | Why we use it | One alternative |
|---|---|---|---|
| **JavaScript** | The programming language for both the browser and the server. | One language everywhere means less to learn at once. | TypeScript (JavaScript with types) |
| **npm workspaces** | npm's built-in way to manage several packages (client + server) in one repo. | One `npm install` and one `npm run dev` start everything. | pnpm workspaces |
| **Git** | Version control that tracks every change to your code. | Lets you undo mistakes and see your progress step by step. | Mercurial |

### Backend
| Technology | What it is | Why we use it | One alternative |
|---|---|---|---|
| **Node.js** | Runs JavaScript outside the browser, on a server. | It lets us write the backend in the same language as the frontend. | Deno |
| **Express** | A small library for building web servers and APIs in Node. | It's simple, very popular, and shows clearly how HTTP requests are handled. | Fastify |
| **PostgreSQL** | A powerful, free relational (SQL) database. | Our data has relationships (user → applications → interviews), which SQL handles well. | MySQL |
| **Prisma** | An ORM: it lets you talk to the database with JavaScript instead of raw SQL, and it manages schema changes ("migrations"). | You get readable models, autocomplete, and safe migrations, which is great for learning. | Drizzle ORM |
| **zod** | A library that checks incoming data has the right shape (e.g. email is a valid email). | It rejects bad input before it reaches the database. | Joi |
| **bcrypt** | A library that hashes passwords so they're never stored in plain text. | It's the industry-standard way to store passwords safely. | argon2 |
| **JWT in an httpOnly cookie** | A signed token proving who you are, stored in a cookie that browser JavaScript can't read. | It keeps users logged in without server-side sessions, and it's safer than localStorage. | Server sessions (express-session) |
| **cookie-parser / cors** | Small Express helpers to read cookies and to control which websites may call the API. | They're needed for cookie-based auth and for local development. | Hand-written middleware |

### Frontend
| Technology | What it is | Why we use it | One alternative |
|---|---|---|---|
| **React** | A library for building UIs out of reusable components. | It's the most widely used frontend library, and its skills transfer well. | Vue |
| **Vite** | A fast dev server and build tool for frontend projects. | Instant reload while coding, and it produces optimized files for production. | Webpack |
| **React Router** | Handles pages and URLs in a React app (e.g. `/applications/123`). | We need multiple pages without full page reloads. | TanStack Router |
| **TanStack Query** | Fetches, caches, and refreshes server data in React. | It removes a lot of manual loading, error, and refetch code. | SWR |
| **Tailwind CSS** | CSS through small utility class names written in your HTML/JSX. | It's fast to style and needs no separate CSS files to manage. | CSS Modules |
| **@dnd-kit** | A drag-and-drop library for React. | It powers the Kanban board. | react-beautiful-dnd (now unmaintained) / pragmatic-drag-and-drop |
| **Recharts** | A charting library for React. | It draws the "applications per week" chart on the dashboard. | Chart.js |

### Testing & tooling
| Technology | What it is | Why we use it | One alternative |
|---|---|---|---|
| **Vitest** | A test runner: it runs your test files and reports pass or fail. | It's fast, works naturally with Vite, and is used for both client and server. | Jest |
| **Supertest** | Sends fake HTTP requests to the Express app inside tests. | It tests the API without starting a real server. | Using `fetch` against a running server |
| **React Testing Library** | Tests components the way a user uses them (clicking, typing). | It checks behavior, not implementation details. | Enzyme (outdated) / Playwright component tests |
| **Docker & Docker Compose** | Docker runs software in isolated "containers"; Compose starts several containers from one file. | Postgres runs with one command, without installing it on Windows. Later, the server is shipped as a container to AWS. | Installing Postgres directly |
| **ESLint + Prettier** | ESLint finds likely bugs; Prettier formats code automatically. | Keeps the code consistent and catches mistakes early. | Biome |

### AWS (deployment)
| Technology | What it is | Why we use it | One alternative |
|---|---|---|---|
| **IAM** | AWS's users and permissions system. | We create a safe, non-root user to work with. | (required by AWS; no real alternative) |
| **Amazon RDS (PostgreSQL)** | Managed Postgres hosted by AWS (backups and updates handled for you). | It's the production database without us running database servers. | Postgres on the EC2 box itself |
| **Amazon EC2** | A virtual Linux server in the cloud. | It runs our server's Docker container, and you learn how servers actually work. | AWS Elastic Beanstalk / ECS Fargate |
| **Amazon ECR** | AWS's private storage for Docker images. | EC2 pulls our server image from here. | Docker Hub |
| **Amazon S3** | File storage in the cloud. | It hosts the built React files (HTML/JS/CSS). | AWS Amplify Hosting |
| **Amazon CloudFront** | A CDN that serves files fast worldwide, with HTTPS. | It serves the React app and forwards `/api/*` to EC2, so everything is on one domain and cookies just work. | Nginx in front of everything on EC2 |
| **AWS Budgets** | Sends alerts when spending passes a set amount. | Prevents surprise bills while learning. | Billing alarms in CloudWatch |

---

## Folder structure (monorepo)
```
job-tracker/
├── package.json          # Root: lists the workspaces; scripts to run/test everything at once
├── docker-compose.yml    # Starts local Postgres in Docker
├── .env.example          # Template of required environment variables (no real secrets)
├── .gitignore            # Files git should ignore (node_modules, .env, build output)
├── README.md             # How to install, run, test, deploy
├── docs/
│   └── SPEC.md           # This plan: the living project spec
├── client/               # FRONTEND: the React app users see in the browser
│   ├── index.html        # The single HTML page React mounts into
│   ├── vite.config.js    # Vite settings; forwards /api calls to the backend in dev
│   └── src/
│       ├── main.jsx      # Entry point: starts React and wraps it in providers
│       ├── App.jsx       # Defines the routes (which page shows at which URL)
│       ├── api/          # Functions that call the backend (one file per resource)
│       ├── hooks/        # Custom React hooks, mostly TanStack Query wrappers
│       ├── context/      # Shared app state (who is logged in)
│       ├── lib/          # Constants and helpers (status list, labels, formatting)
│       ├── pages/        # One component per screen (Login, Dashboard, Applications, Detail)
│       ├── components/   # Reusable UI pieces, grouped by feature:
│       │   ├── layout/        #   navbar, page shell, protected-route guard
│       │   ├── applications/  #   table, kanban board, form, filters, status badge, timeline
│       │   ├── interviews/    #   interview list and form, upcoming list
│       │   ├── contacts/      #   contact list and form
│       │   ├── dashboard/     #   stat cards, weekly chart
│       │   └── ui/            #   generic building blocks: Button, Input, Modal...
│       └── test/         # Test setup and component tests
├── server/               # BACKEND: the Express API that talks to the database
│   ├── Dockerfile        # Recipe for packaging the server as a Docker image (deploy phase)
│   ├── prisma/
│   │   ├── schema.prisma # The data model: tables, fields, relations
│   │   ├── migrations/   # Auto-generated SQL history of schema changes
│   │   └── seed.js       # Fills the DB with demo data
│   ├── src/
│   │   ├── server.js     # Starts listening on a port
│   │   ├── app.js        # Builds the Express app (kept separate so tests can import it)
│   │   ├── config/       # Reads and validates environment variables
│   │   ├── db/           # The shared Prisma client
│   │   ├── middleware/   # Code that runs on every request (auth check, validation, errors)
│   │   ├── routes/       # Maps URLs + HTTP methods to controllers
│   │   ├── controllers/  # Reads the request, calls a service, sends the response
│   │   ├── services/     # Business logic and database queries
│   │   ├── validators/   # zod schemas describing valid request bodies and queries
│   │   └── utils/        # Small helpers (JWT, CSV, HTTP errors)
│   └── tests/            # API tests with Supertest
└── deploy/               # AWS notes/scripts (e.g. EC2 setup script, CloudFront settings)
```
Request flow: **route → middleware (auth, validate) → controller → service → Prisma → PostgreSQL**. Each layer has one job, which makes the code easier to understand and test.

---

## Data model (Prisma / PostgreSQL)

**Enums**
- `ApplicationStatus`: WISHLIST, APPLIED, INTERVIEWING, OFFER, REJECTED, WITHDRAWN
- `WorkMode`: REMOTE, HYBRID, ONSITE
- `InterviewType`: PHONE_SCREEN, TECHNICAL, BEHAVIORAL, TAKE_HOME, ONSITE, FINAL, OTHER
- `InterviewOutcome`: PENDING, PASSED, FAILED, CANCELLED

**User**
- `id` (uuid)
- `email` (unique, lowercased)
- `passwordHash`
- `name`
- `createdAt`, `updatedAt`

**Application**
- `id`
- `userId` → User (cascade delete)
- `company`*, `roleTitle`*
- `status` (default WISHLIST)
- `appliedAt` (date, set automatically on the first move to APPLIED)
- `jobUrl`, `location`, `workMode`
- `salaryMin`, `salaryMax`, `salaryCurrency` (default USD)
- `jobDescription`, `resumeVersion`, `coverLetterVersion`, `notes`
- `createdAt`, `updatedAt`
- Indexes: `(userId, status)`, `(userId, appliedAt)`, `(userId, updatedAt)`

**StatusChange** (history)
- `id`
- `applicationId` → Application (cascade)
- `fromStatus` (null when first created)
- `toStatus`
- `changedAt`
- Index: `(applicationId, changedAt)`

**Interview**
- `id`
- `applicationId` → Application (cascade)
- `type`, `scheduledAt`, `durationMinutes`
- `locationOrLink`, `interviewers`
- `outcome` (default PENDING)
- `notes`
- `createdAt`, `updatedAt`
- Index: `(applicationId, scheduledAt)`

**Contact**
- `id`
- `applicationId` → Application (cascade)
- `name`*, `title`
- `email`, `phone`, `linkedinUrl`
- `notes`
- `createdAt`, `updatedAt`

(* = required)

**Rules**
- Ownership is checked in services. Another user's data returns 404.
- All status changes go through one service function that updates the status **and** writes a StatusChange row in a single database transaction.

---

## API endpoints (all under `/api`, JSON)

**Health**
- `GET /health`

**Auth**
- `POST /auth/register`, `POST /auth/login`: these set the cookie
- `POST /auth/logout`: clears the cookie
- `GET /auth/me`

**Applications** (auth required)
- `GET /applications`: list. Query parameters:
  - filters: `status`, `workMode`, `search`
  - sorting: `sort`, `order`
  - paging: `page`, `limit`
- `POST /applications`: also logs the initial status
- `GET /applications/export.csv`: accepts the same filters as the list
- `GET /applications/:id`: includes contacts, interviews, and history
- `PATCH /applications/:id`
- `PATCH /applications/:id/status`: `{ status }`, used by the Kanban board; logs history
- `DELETE /applications/:id`
- `GET /applications/:id/history`

**Interviews**
- `GET` / `POST /applications/:id/interviews`
- `PATCH` / `DELETE /interviews/:interviewId`
- `GET /interviews/upcoming?days=7`

**Contacts**
- `GET` / `POST /applications/:id/contacts`
- `PATCH` / `DELETE /contacts/:contactId`

**Dashboard**
- `GET /dashboard/stats` returns `{ countsByStatus, total, applicationsPerWeek (last 12 weeks), responseRate, upcomingInterviews }`
- `responseRate` = applications that reached INTERVIEWING, OFFER or REJECTED ÷ applications that reached APPLIED.

**Errors:** `{ error: { message, details? } }`, with codes 400 / 401 / 404 / 409 / 500.

---

## Phases & steps (one step at a time; stop after each)

**Phase 0: Project setup**
1. Save this plan as `docs/SPEC.md`.
2. Root `package.json` with workspaces, `.gitignore`, `.env.example`, README skeleton.
3. `docker-compose.yml` for Postgres; start it and connect to confirm it works.

**Phase 1: Server foundation**
1. Create the `server` package; minimal Express app with `GET /api/health`.
2. Split into `app.js` / `server.js`; add the env config, the JSON error handler, and a 404 handler.
3. Install Prisma, connect it to Postgres, and write the `User` model; run the first migration.
4. Add the remaining models (Application, StatusChange, Interview, Contact); run a migration and explore the data with Prisma Studio.
5. Write the seed script with a demo user and sample data.

**Phase 2: Authentication (backend)**
1. Set up Vitest + Supertest with a test database; write a first test for `/health`.
2. `POST /auth/register` with zod validation and bcrypt.
3. `POST /auth/login`, the JWT cookie, `GET /auth/me`, `POST /auth/logout`.
4. `requireAuth` middleware, plus auth tests.

**Phase 3: Applications API**
1. Create, list, and get one application, scoped to the logged-in user.
2. Update and delete, plus ownership tests (user B can't see user A's data).
3. The status-change service: transaction + history, and `PATCH /:id/status` / `GET /:id/history`.
4. List filters, search, sorting, and pagination.

**Phase 4: Interviews & contacts API**
1. Interview CRUD plus `GET /interviews/upcoming`, with tests.
2. Contact CRUD, with tests.

**Phase 5: Dashboard & export API**
1. `GET /dashboard/stats`, with tests checking the math.
2. `GET /applications/export.csv`, with a test.

**Phase 6: Client foundation**
1. Scaffold the Vite + React app in `client/`, add Tailwind, and set up the dev proxy to the API.
2. React Router: layout, navbar, and placeholder pages.
3. API fetch wrapper + TanStack Query setup.
4. AuthContext, Login/Register pages, ProtectedRoute, and logout.

**Phase 7: Applications UI**
1. Applications table, connected to the list API.
2. Filter bar: status, work mode, search, and sorting.
3. Create/edit application form (modal) and delete with a confirm dialog.
4. Application detail page with the status timeline.

**Phase 8: Kanban board**
1. Board layout with one column per status, plus the table/kanban toggle.
2. Drag and drop with @dnd-kit, calling the status endpoint with optimistic updates.

**Phase 9: Interviews & contacts UI**
1. Interview list and form on the detail page.
2. Contact list and form on the detail page.

**Phase 10: Dashboard UI & export**
1. Stat cards, status counts, and the upcoming-interviews list.
2. Weekly chart (Recharts) and the CSV export button.

**Phase 11: Quality pass**
1. Component tests (form validation, Kanban status change, filter bar).
2. Loading, error, and empty states; ESLint + Prettier; finish the README.

**Phase 12: Deploy to AWS**
1. AWS basics: an IAM admin user (not root), MFA, a region choice, and an **AWS Budgets** alert.
2. Production-ready config:
   - secure cookie settings and CORS
   - `npm run build` for the client
   - production start script for the server
3. Write `server/Dockerfile`; build and run it locally against Docker Postgres.
4. Create an **RDS PostgreSQL** instance (free-tier size) and a security group.
5. Push the server image to **ECR**. Launch **EC2**, install Docker, run the container with env vars, and run `prisma migrate deploy`.
6. Upload the client build to **S3**. Create a **CloudFront** distribution with two routes:
   - `/*` → S3
   - `/api/*` → EC2
7. HTTPS check and a full smoke test on the live URL.
8. Cost review and a teardown checklist: how to stop or delete resources to avoid charges.

---

## Verification
- **Each step:** run the server or client, show that it works (curl/browser/test output), then stop for your review.
- **Server:** `npm test -w server`. Covers:
  - auth
  - CRUD
  - ownership isolation
  - status history
  - stats math
  - CSV
- **Client:** `npm test -w client`.
- **End-to-end (local and on AWS):**
  - register, then add an application
  - drag it across the Kanban board and confirm the timeline updates
  - add an interview and see it on the dashboard
  - export CSV
  - log out and confirm protected routes redirect to login
