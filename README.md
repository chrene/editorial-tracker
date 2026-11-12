# editorial-tracker

## Use of AI

I used Claude AI to help write the code and files in this repository. The architectural
decisions are mine: the workspace layout, the split between frontend, backend and shared,
the choice of tools, and how the pieces fit together. I reviewed everything that landed in
the repo and I can explain any of it.

## Workspace

pnpm workspace with three packages:

| Package                       | Path                | What it is                  |
| ----------------------------- | ------------------- | --------------------------- |
| `@editorial-tracker/frontend` | `packages/frontend` | React app (Vite)            |
| `@editorial-tracker/backend`  | `packages/backend`  | Express API                 |
| `@editorial-tracker/shared`   | `packages/shared`   | Types and code used by both |

## Setup

### 1. Install Node.js 26

The required version is in `.nvmrc`. With `nvm` or `fnm`:

```bash
nvm install && nvm use
```

Or install Node 26 LTS from https://nodejs.org.

Check it works:

```bash
node -v
```

### 2. Install pnpm

macOS, with Homebrew:

```bash
brew install pnpm
```

macOS or Linux, with the official installer:

```bash
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

Windows, in PowerShell:

```powershell
iwr https://get.pnpm.io/install.ps1 -useb | iex
```

Check it works:

```bash
pnpm -v
```

The exact pnpm version doesn't matter. `package.json` pins the version for this project (`devEngines.packageManager`), and pnpm downloads that version on its own when the one you have differs.

### 3. Install dependencies

From the repo root:

```bash
pnpm install
```

### 4. Approve build scripts (only when asked)

pnpm blocks dependencies from running install scripts unless they are approved. Approved packages are listed in `pnpm-workspace.yaml`, which is committed to the repo. A fresh clone needs no extra steps.

If `pnpm install` or `pnpm add` fails with `ERR_PNPM_IGNORED_BUILDS`:

1. Run:

   ```bash
   pnpm approve-builds
   ```

2. Select only the packages you trust (for example `esbuild`).
3. Run `pnpm install` again.
4. Commit the updated `pnpm-workspace.yaml` so others don't have to repeat this.

## Running locally

The two options below serve the app on **different ports**. Which one you are
running decides which URL to open.

### Option A: everything in Docker

The app is served by nginx on **http://localhost:8080**, not 5173.

| What     | URL                                          |
| -------- | -------------------------------------------- |
| App      | http://localhost:8080                        |
| API      | http://localhost:8080/api/health (via nginx) |
| Postgres | `localhost:5432`                             |

Code changes do **not** appear until you rebuild the image:
`docker compose up -d --build frontend`. For a fast edit loop, use Option B.

Run from the repo root.

| Task                                    | Command                                                         |
| --------------------------------------- | --------------------------------------------------------------- |
| Start everything (rebuild images)       | `docker compose up -d --build`                                  |
| Start only Postgres                     | `docker compose up -d db`                                       |
| Show running services                   | `docker compose ps`                                             |
| Follow logs for all services            | `docker compose logs -f`                                        |
| Follow logs for one service             | `docker compose logs -f backend`                                |
| Rebuild and restart one service         | `docker compose up -d --build backend`                          |
| Restart one service (no rebuild)        | `docker compose restart backend`                                |
| Open a Postgres shell                   | `docker compose exec db psql -U editorial -d editorial_tracker` |
| Stop and remove containers (keeps data) | `docker compose down`                                           |
| Stop and **delete the database**        | `docker compose down -v`                                        |

Service names: `db`, `backend`, `frontend`.

> `docker compose down -v` deletes the `pgdata` volume. All database data is lost and cannot be recovered.

### Option B: apps on your machine, Postgres in Docker

Use this for day-to-day development. Code changes reload instantly.

1. Create `packages/backend/.env`:

   ```
   DATABASE_URL=postgres://editorial:editorial@localhost:5432/editorial_tracker
   ```

2. Start only Postgres:

   ```bash
   docker compose up -d db
   ```

3. Start the apps:

   ```bash
   pnpm dev
   ```

- App: http://localhost:5173 (Vite, hot reloads on save)
- API: http://localhost:5173/api/health (proxied to Express on port 3000)

Nothing runs on 8080 in this mode. Stop the Docker `backend` container first, or
it will hold port 3000: `docker compose stop backend frontend`.

## Database

There are no migration files. The schema lives in `packages/backend/prisma/schema.prisma`
and is applied by diffing it against the running database.

From `packages/backend`, with Postgres up:

| Task                             | Command          |
| -------------------------------- | ---------------- |
| Apply the schema to the database | `pnpm db:push`   |
| Seed the hardcoded users         | `pnpm db:seed`   |
| Browse the data in a UI          | `pnpm db:studio` |

Run `db:push` then `db:seed` once after first starting Postgres, and `db:push`
again whenever `schema.prisma` changes.

### Signing in

Authentication is mocked: a request names its user with an `x-user-id` header,
matched against the hardcoded list in `packages/shared/src/users.ts`. There are
no passwords. `GET /api/users` returns the list so the frontend can offer a
"sign in as" picker.

| User         | Role        | Sees                              |
| ------------ | ----------- | --------------------------------- |
| Edith Ortega | editor      | Every content item                |
| Carl Nguyen  | contributor | Only items they created or author |
| Priya Raman  | contributor | Only items they created or author |

### API

All routes need an `x-user-id` header and return only what that user may see.

| Method   | Path                      | Does                                     |
| -------- | ------------------------- | ---------------------------------------- |
| `GET`    | `/api/content`            | All content items visible to the caller  |
| `POST`   | `/api/content`            | Create an item (starts at `idea`)        |
| `PATCH`  | `/api/content/:id`        | Edit title, type, authors or deadline    |
| `PATCH`  | `/api/content/:id/status` | Move the item to a new status            |
| `DELETE` | `/api/content/:id`        | Delete the item; its audit history stays |
| `GET`    | `/api/content/:id/audit`  | Change history for one item              |
| `GET`    | `/api/users`              | The hardcoded user list                  |

Status moves follow `idea -> draft -> review -> published -> archived`.
`draft` and `review` can step back, and an archived item can be restored to
`published` or sent back to `draft`. Anything else returns `409`.

### Using the app

Open the app and pick a user — there are no passwords. The URL depends on how
you started it: **http://localhost:8080** for Option A (Docker), or
**http://localhost:5173** for Option B (Vite).

| Screen       | Path           | What it does                                                      |
| ------------ | -------------- | ----------------------------------------------------------------- |
| Login        | `/login`       | Pick a demo user; the role decides what you can reach             |
| Dashboard    | `/`            | Items grouped by status and filterable, with creator and deadline |
| Content item | `/content/:id` | Publish, edit, archive, and the item's full history               |

The dashboard's create form is on the right. Overdue deadlines are marked in red,
and only statuses the state machine allows appear as buttons on an item.

## Code style

ESLint and Prettier are configured once at the repo root and cover all three packages. ESLint catches bugs; Prettier owns formatting. They don't overlap — `eslint-config-prettier` turns off every ESLint rule that would argue about layout.

Run from the repo root:

| Task                           | Command             |
| ------------------------------ | ------------------- |
| Check for lint errors          | `pnpm lint`         |
| Fix what ESLint can fix        | `pnpm lint:fix`     |
| Format every file              | `pnpm format`       |
| Check formatting without edits | `pnpm format:check` |

Config files:

- `eslint.config.js` — flat config. TypeScript rules everywhere, React hooks and fast-refresh rules for `packages/frontend` only, Node globals for `packages/backend` and `packages/shared`.
- `.prettierrc` — single quotes, semicolons, trailing commas, 100-character lines.
- `.prettierignore` — skips `dist`, `node_modules` and the lockfile.

Both tools run from the root, so individual packages have no lint config or lint dependencies of their own. Add new rules in `eslint.config.js`.

Most editors pick up `.prettierrc` automatically. For format-on-save in VS Code, install the Prettier extension and set it as the default formatter.

## Architecture decisions

| Date       | Decision                                                                  | Why                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ---------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-11-12 | pnpm workspace with `frontend`, `backend` and `shared` packages           | Types shared between the React app and the API without publishing anything. Costs a workspace tool the whole team has to install.                                                                                                                                                                                                                                                                                                             |
| 2026-11-12 | `shared` exports TypeScript source directly, with no build step           | No build to run or watch before the other packages see a change. Only works because both consumers compile TS themselves.                                                                                                                                                                                                                                                                                                                     |
| 2026-11-12 | Postgres in Docker, apps on the host for day-to-day work                  | Instant reload on code changes while the database stays disposable. Full `docker compose up` stays available for a production-like run.                                                                                                                                                                                                                                                                                                       |
| 2026-11-12 | One ESLint and Prettier config at the repo root, not per package          | One version of each tool and one place to add rules. Packages cannot diverge, which is the point.                                                                                                                                                                                                                                                                                                                                             |
| 2026-11-12 | Root `typescript` pinned to 6.x for linting; backend builds on TS 7       | `typescript-eslint` 8.x refuses TS 7. Keeps linting working without holding the backend back.                                                                                                                                                                                                                                                                                                                                                 |
| 2026-11-12 | `npm` kept in the Dockerfile only to install pnpm                         | `node:26-slim` ships no corepack, curl or wget. The npm-free route costs an apt-get layer, which is not worth it for one bootstrap line.                                                                                                                                                                                                                                                                                                      |
| 2026-11-12 | Prisma as the ORM, with `prisma db push` and no migration files           | Replaced Drizzle after building both and comparing them. The query code reads better — `db.contentItem.update({ where, data })` instead of a builder chain ending in `.returning()` — which is why it was changed. It costs a `prisma generate` codegen step, a `prisma.config.ts` that repeats the connection string, and a Node-version warning. The service file came out 2 lines shorter, so this was a readability call, not a size one. |
| 2026-11-12 | Audit columns on `content_items` **and** an append-only `audit_log` table | "Who published this" stays a single column read, while the log answers "what changed, when, by whom" — which an editorial team actually needs. Costs a second write on every mutation.                                                                                                                                                                                                                                                        |
| 2026-11-12 | Content type as a Postgres enum, not a lookup table                       | Two known values, and the `'article' \| 'video'` union reaches the frontend so a typo is a compile error. Adding a type means a schema edit and a push, not an INSERT.                                                                                                                                                                                                                                                                        |
| 2026-11-12 | `status` is an explicit state machine; `publishedAt` is only a by-product | Transitions are declared in `packages/shared/src/status.ts`, so `idea` cannot jump to `review`. Status is the single source of truth for whether an item is live — deriving it from `publishedAt` would let an item sit on `review` while carrying a publish timestamp.                                                                                                                                                                       |
| 2026-11-12 | The database schema lives in `packages/backend`, not in `shared`          | The browser talks to the API, never to Postgres, so `shared` keeps zero runtime dependencies. The cost is `serialize.ts`, which maps rows to the wire types — honest anyway, since JSON turns every `Date` into a string.                                                                                                                                                                                                                     |
| 2026-11-12 | Mock auth: `x-user-id` header against a hardcoded user list               | No passwords or sessions to build for an assignment. The list is seeded into a `users` table so author and audit-actor ids are real foreign keys, and swapping in real auth means replacing one middleware.                                                                                                                                                                                                                                   |
| 2026-11-12 | Routes hold no logic: thin HTTP adapters over a service layer             | A route reads the request, calls a service and picks a status code — nothing else. Permissions, status transitions and audit writes live in `services/`, which knows nothing about HTTP, so the same calls would serve a CLI or a job queue. Services throw domain errors (`errors.ts`) that one middleware maps to status codes.                                                                                                             |
| 2026-11-12 | Readability is a standing requirement, not a cleanup pass                 | Functions are short and named for what they do, comments explain _why_ rather than restating the code, and anything subtle (a `404` that hides existence, a filter pushed into SQL) says so at the point it happens. Costs more lines than the terse version; worth it because this code is read far more often than it is written.                                                                                                           |
| 2026-11-12 | Zod for request validation and `http-errors` for failures                 | Replaced ~130 lines of hand-rolled parsing and custom error classes with two well-known packages. Zod schemas are declarative and infer their own input types; `http-errors` is what Express itself uses. Two more dependencies, far less code to read or get wrong.                                                                                                                                                                          |
| 2026-11-12 | A status move has its own endpoint: `PATCH /content/:id/status`           | A transition is checked against the state machine and stamps who published or archived — not a field edit. `status` was removed from the general `PATCH` body so there is exactly one way to move an item, and one place that rule lives.                                                                                                                                                                                                     |
| 2026-11-12 | Archiving is reversible; status stamps are cleared on exit                | An archived item can be restored to `published` or sent back to `draft` — archiving is a shelf, not a grave. A timestamp is written when an item enters a status and cleared when it leaves, so a restored item cannot still claim it was archived. `publishedAt` survives a restore, because it really was published then.                                                                                                                   |
| 2026-11-12 | React Router and TanStack Query on the frontend                           | Query owns loading, error and refetch state, so publishing an item refreshes the dashboard and the item view on its own — no screen has to remember to refetch. Router keeps `/content/:id` a real URL that survives a refresh. Two dependencies instead of hand-rolled `useEffect` fetching in every screen.                                                                                                                                 |
| 2026-11-12 | One plain CSS stylesheet, no CSS framework                                | Five screens do not need a framework or a build plugin. Tokens live in `:root` and the markup stays readable. Would not scale to a large app; it is not meant to.                                                                                                                                                                                                                                                                             |
| 2026-11-12 | Login is a user picker; the choice sits in `sessionStorage`               | Matches the mocked backend auth — no passwords exist, so "signing in" is choosing who you are. `sessionStorage` stops a refresh from logging you out. Swapping in real auth means replacing `AuthProvider` and the `x-user-id` header in `lib/api.ts`.                                                                                                                                                                                        |
| 2026-11-12 | `GET /api/users` is public; everything else needs a user                  | The login screen must list the users before anyone is signed in. The list is the hardcoded demo roster and holds no secrets. `/api/content` stays behind the auth middleware.                                                                                                                                                                                                                                                                 |

## Troubleshooting

| Error                                                                 | Fix                                                                                                                                              |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Invalid package manager specification ... expected a semver version` | The pnpm version in `package.json` must be exact, e.g. `12.18.0`, not `^12.18.0`.                                                                |
| `ERR_PNPM_IGNORED_BUILDS`                                             | See step 4.                                                                                                                                      |
| `pnpm: command not found`                                             | Open a new terminal after step 2, or check that pnpm's bin folder (`~/Library/pnpm` on macOS, `~/.local/share/pnpm` on Linux) is on your `PATH`. |
| `typescript-eslint does not support TS 7.0`                           | The root `typescript` devDependency must stay on 6.x — that's the version ESLint parses with. Package builds are unaffected.                     |
| Port `3000` already in use                                            | A Docker `backend` container and a local `pnpm dev` cannot both have it. Run `docker compose stop backend`, or stop the local one.               |
| App loads but your code changes are missing                           | You are on Option A. The image is stale: `docker compose up -d --build frontend`, then hard-reload the browser.                                  |
| Port `5432` already in use                                            | Another Postgres is running. Stop it, or change the port mapping in `docker-compose.yaml` to `"5433:5432"` and use `5433` in `DATABASE_URL`.     |
