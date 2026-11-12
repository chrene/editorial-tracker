# Editorial Tracker

A small editorial workflow tool. Editors and contributors sign in, create
articles and videos, and move them from idea to publication. Every change is
recorded in a per-item history.

Built with React, Express, Prisma and PostgreSQL in a pnpm workspace.

## Use of AI

I used Claude AI to help write the code and files in this repository. The architectural
decisions are mine: the workspace layout, the split between frontend, backend and shared,
the choice of tools, and how the pieces fit together. I reviewed everything that landed in
the repo and I can explain any of it.

## Quickstart

With Docker running and pnpm installed:

```bash
pnpm docker:start
```

This builds and starts the app, API and Postgres, creates the tables and adds
three demo users. Open **http://localhost:8080** and pick a user. There are no
passwords.

### A two-minute tour

1. Sign in as **Edith Ortega** (editor) and create an item. It starts as an **idea**.
2. Move it **idea → draft → review → published**. Skipping a step is rejected.
3. Sign in as **Carl Nguyen** (contributor). Edith's item is not in his list.
   Create one as Carl, then sign back in as Edith: she sees both.
4. **Archive** an item, then **Restore** it. The history panel shows every step
   and who took it.

## How it works

### Roles

| User         | Role        | Can see and manage      |
| ------------ | ----------- | ----------------------- |
| Edith Ortega | editor      | Every content item      |
| Carl Nguyen  | contributor | Only items they created |
| Priya Raman  | contributor | Only items they created |

Sign-in is simulated: you pick who you are, and the API applies that user's
role to every request.

### Workflow

| From        | Can move to          |
| ----------- | -------------------- |
| `idea`      | `draft`              |
| `draft`     | `idea`, `review`     |
| `review`    | `draft`, `published` |
| `published` | `archived`           |
| `archived`  | `published`, `draft` |

Any other move is rejected with `409`. The item view only shows the moves the
current status allows.

### Screens

| Screen       | Path           | What it does                                                                                       |
| ------------ | -------------- | -------------------------------------------------------------------------------------------------- |
| Login        | `/login`       | Pick a demo user                                                                                   |
| Dashboard    | `/`            | Items grouped and filterable by status, with creator, authors and deadline; form to create an item |
| Content item | `/content/:id` | Publish, archive, restore, edit, and the item's full history                                       |

Overdue deadlines are shown in red while an item is still in progress.

## Assumptions

| Topic      | Assumption                                                                                                         |
| ---------- | ------------------------------------------------------------------------------------------------------------------ |
| Sign-in    | Users pick a demo identity. There are no passwords or sessions.                                                    |
| Ownership  | A contributor's "own" items are the ones they created. Being listed as an author is a credit and grants no access. |
| Publishing | A contributor can move their own items through the whole workflow, including publishing and archiving.             |
| Publish    | Publishing records a workflow state. Nothing is sent to a live site.                                               |
| Timestamps | `publishedAt` is when an item first went live and survives a restore. `archivedAt` is cleared on restore.          |
| Content    | Types are Article and Video. Deadlines are optional. The creator is stored separately from extra authors.          |

## Known limitations

- **No automated tests.** Behaviour was checked by hand against the running API.
- **No real authentication.** The API trusts the `x-user-id` header.
- **No migration history.** The schema is applied with `prisma db push`.
- **No compile step.** The backend runs its TypeScript through `tsx` instead of compiled JavaScript.

## Running it

### With Docker

All commands run from the repo root.

| Script                | Does                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------ |
| `pnpm docker:start`   | `docker:up` followed by `docker:setup`                                                     |
| `pnpm docker:up`      | Build and start the app, API and Postgres                                                  |
| `pnpm docker:setup`   | Create the tables and seed the demo users, from a one-off setup container (safe to re-run) |
| `pnpm docker:rebuild` | Rebuild the app and API after a code change; Postgres keeps running                        |
| `pnpm docker:db`      | Start only Postgres                                                                        |
| `pnpm docker:logs`    | Follow the logs of all services                                                            |
| `pnpm docker:down`    | Stop and remove the containers; the database is kept                                       |

The app is on **http://localhost:8080**, and the API on
http://localhost:8080/api via nginx. `docker compose down -v` deletes the
database volume for good.

### For development

Needs Node 26 (`nvm use` reads `.nvmrc`) and pnpm (`brew install pnpm`, or see
https://pnpm.io/installation).

```bash
pnpm install
pnpm docker:db
pnpm --filter @editorial-tracker/backend db:push
pnpm --filter @editorial-tracker/backend db:seed
pnpm dev
```

The app runs on **http://localhost:5173** with hot reload, and proxies `/api`
to Express on port 3000. If the full Docker stack is running, stop it first
with `pnpm docker:down`, because its backend holds port 3000.

| Task                | Command                                              |
| ------------------- | ---------------------------------------------------- |
| Lint                | `pnpm lint`                                          |
| Format              | `pnpm format`                                        |
| Check formatting    | `pnpm format:check`                                  |
| Browse the database | `pnpm --filter @editorial-tracker/backend db:studio` |

## Where things live

| Package             | Contains                                              |
| ------------------- | ----------------------------------------------------- |
| `packages/frontend` | React app (Vite)                                      |
| `packages/backend`  | Express API and Prisma schema                         |
| `packages/shared`   | Wire types, status rules and demo users, used by both |

| Rule or concern             | File                                                      |
| --------------------------- | --------------------------------------------------------- |
| Allowed status moves        | `packages/shared/src/status.ts`                           |
| Who can see and manage what | `visibleTo` in `packages/backend/src/services/content.ts` |
| Request validation          | `packages/backend/src/validation.ts`                      |
| Errors to status codes      | `packages/backend/src/middleware/errors.ts`               |
| Audit log                   | `packages/backend/src/audit.ts`                           |
| Database schema             | `packages/backend/prisma/schema.prisma`                   |
| Wire types                  | `packages/shared/src/types.ts`                            |
| Demo users                  | `packages/shared/src/users.ts`                            |

### API

Every route except `/api/health` and `/api/users` needs an `x-user-id` header
and returns only what that user may see. A hidden item answers `404`, the
same as a missing one.

| Method   | Path                      | Does                                  |
| -------- | ------------------------- | ------------------------------------- |
| `GET`    | `/api/users`              | The demo users, for the login screen  |
| `GET`    | `/api/content`            | Items visible to the caller           |
| `POST`   | `/api/content`            | Create an item; it starts at `idea`   |
| `GET`    | `/api/content/:id`        | One item                              |
| `PATCH`  | `/api/content/:id`        | Edit title, type, authors or deadline |
| `PATCH`  | `/api/content/:id/status` | Move the item to a new status         |
| `DELETE` | `/api/content/:id`        | Delete the item; its history is kept  |
| `GET`    | `/api/content/:id/audit`  | The item's change history             |

## Architecture decisions

| Date       | Decision                                                                              | Why                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ---------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-11-12 | pnpm workspace with `frontend`, `backend` and `shared` packages                       | Types are shared between the React app and the API without publishing anything. Costs a workspace tool everyone has to install.                                                                                                                                                                                                                                                                                                    |
| 2026-11-12 | `shared` exports TypeScript source directly, with no build step                       | Both consumers compile TypeScript themselves, so a change is picked up without a build or a watcher.                                                                                                                                                                                                                                                                                                                               |
| 2026-11-12 | Postgres in Docker, apps on the host for development                                  | Hot reload on code changes while the database stays disposable. The full Docker stack is there for a production-like run.                                                                                                                                                                                                                                                                                                          |
| 2026-11-12 | One ESLint and Prettier config at the repo root                                       | One version of each tool and one place to add rules, so packages cannot diverge.                                                                                                                                                                                                                                                                                                                                                   |
| 2026-11-12 | Root `typescript` pinned to 6.x for linting; the backend builds on TS 7               | `typescript-eslint` 8 refuses TS 7. This keeps linting working without holding the backend back.                                                                                                                                                                                                                                                                                                                                   |
| 2026-11-12 | `npm` used in the Dockerfile only to install pnpm                                     | `node:26-slim` ships without corepack, curl or wget. The npm-free route costs an extra apt-get layer for one bootstrap line.                                                                                                                                                                                                                                                                                                       |
| 2026-11-12 | Prisma as the ORM, with `prisma db push` and no migration files                       | Chosen after building the backend with both Drizzle and Prisma. Prisma's queries read better: `db.contentItem.update({ where, data })` instead of a builder chain. The client is generated into `packages/backend/src/generated` (not committed) so the runtime image can copy it without the CLI. Costs a `prisma generate` step, a `prisma.config.ts` that repeats the connection string, and a Node-version warning.            |
| 2026-11-12 | Audit columns on `content_items` plus an append-only `audit_log` table                | "Who published this" stays a single column read, and the log answers what changed, when and by whom. Each write commits the row and its log entry in one transaction, so the log has no gaps.                                                                                                                                                                                                                                      |
| 2026-11-12 | Content type as a Postgres enum, not a lookup table                                   | Two known values, and the `'article' \| 'video'` union reaches the frontend, so a typo is a compile error. Adding a type means a schema change, not an INSERT.                                                                                                                                                                                                                                                                     |
| 2026-11-12 | `status` is an explicit state machine and the only source of truth                    | Transitions are declared once in `status.ts`. Timestamps record when moves happened but never decide the status, so an item cannot sit on `review` while carrying a publish date.                                                                                                                                                                                                                                                  |
| 2026-11-12 | Archiving is reversible; `publishedAt` means first published                          | Archive is a shelf, not a grave. `archivedAt` is set on the way in and cleared on the way out. `publishedAt` is never overwritten, and re-sending the current status is a no-op, so nothing is stamped without a history entry.                                                                                                                                                                                                    |
| 2026-11-12 | A status move has its own endpoint: `PATCH /content/:id/status`                       | A move is checked against the state machine and stamps who published or archived, so it is not a field edit. There is exactly one way to change status.                                                                                                                                                                                                                                                                            |
| 2026-11-12 | The database schema lives in `backend`; `shared` holds hand-written wire types        | Prisma's types describe rows, where `createdAt` is a `Date`; the browser receives ISO strings. `shared` must also stay free of `@prisma/client` for the frontend bundle. `serialize.ts` converts, and `schema-contract.ts` fails the build if enum members or field names drift apart.                                                                                                                                             |
| 2026-11-12 | Routes hold no logic                                                                  | A route reads the request, calls a service and returns. Permissions, transitions and audit writes live in `services/`, which knows nothing about HTTP. One error middleware turns failures into status codes.                                                                                                                                                                                                                      |
| 2026-11-12 | Zod for validation and `http-errors` for failures                                     | Replaces about 130 lines of hand-written parsing and error classes with two widely used packages. Zod schemas also infer their input types.                                                                                                                                                                                                                                                                                        |
| 2026-11-12 | Mock sign-in: a user picker, an `x-user-id` header, a public user list                | There are no passwords to check. The choice is kept in `sessionStorage` so a refresh does not sign you out, and the users are seeded into the database so author and actor ids are real foreign keys. Real auth would replace `AuthProvider` and one middleware.                                                                                                                                                                   |
| 2026-11-12 | React Router and TanStack Query on the frontend                                       | Query owns loading, error and refetching, so publishing refreshes the dashboard and the item view without extra code. Cache keys include the user id, so switching user never shows the previous user's data.                                                                                                                                                                                                                      |
| 2026-11-12 | One plain CSS stylesheet, no CSS framework                                            | Three screens do not need a framework or a build plugin. Would not scale to a large app; it is not meant to.                                                                                                                                                                                                                                                                                                                       |
| 2026-11-13 | A contributor's own items are the ones they created; authors are credits              | Follows the brief: contributors view and manage only their own items. One database filter decides access for both the list and single-item reads. Replaced an earlier rule where being an author granted access.                                                                                                                                                                                                                   |
| 2026-11-13 | The runtime image holds production dependencies only; setup tooling has its own image | The backend image was 971MB because it carried every workspace package, the pnpm store and the Prisma CLI. The CLI is only needed to create the tables, so `db push` and the seed now run in a separate `setup` image, and the runtime image installs production dependencies without pnpm: 369MB, of which 272MB is the Node base image. The server still runs TypeScript through `tsx`, so there is no compile step to maintain. |
| 2026-11-13 | No comments in the source; names carry the meaning                                    | Conditions that need explaining get a named function or variable instead, such as `isRowDeletedByAnotherRequestBeforeOurWrite`. The reasoning behind each choice lives in this table.                                                                                                                                                                                                                                              |

## Troubleshooting

| Problem                                     | Fix                                                                                                                      |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Login works, then loading content fails     | The database is empty. Run `pnpm docker:setup`.                                                                          |
| Code changes are missing on port 8080       | The images are stale. Run `pnpm docker:rebuild`, then hard-reload the browser.                                           |
| Port `3000` already in use                  | The Docker backend and `pnpm dev` both want it. Run `pnpm docker:down`, or stop the local server.                        |
| Port `5432` already in use                  | Another Postgres is running. Stop it, or map `"5433:5432"` in `docker-compose.yaml` and set `DATABASE_URL` to port 5433. |
| `ERR_PNPM_IGNORED_BUILDS`                   | Run `pnpm approve-builds`, approve the packages you trust, then `pnpm install` again.                                    |
| `pnpm: command not found`                   | Open a new terminal, or add pnpm's bin folder to your `PATH`.                                                            |
| `typescript-eslint does not support TS 7.0` | Keep the root `typescript` devDependency on 6.x; it is only used for linting.                                            |
