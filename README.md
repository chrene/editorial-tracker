# editorial-tracker

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

## Option a: Docker

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

- App: http://localhost:5173
- API: http://localhost:5173/api/health (proxied to Express on port 3000)

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

## Troubleshooting

| Error                                                                 | Fix                                                                                                                                              |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Invalid package manager specification ... expected a semver version` | The pnpm version in `package.json` must be exact, e.g. `12.18.0`, not `^12.18.0`.                                                                |
| `ERR_PNPM_IGNORED_BUILDS`                                             | See step 4.                                                                                                                                      |
| `pnpm: command not found`                                             | Open a new terminal after step 2, or check that pnpm's bin folder (`~/Library/pnpm` on macOS, `~/.local/share/pnpm` on Linux) is on your `PATH`. |
| `typescript-eslint does not support TS 7.0`                           | The root `typescript` devDependency must stay on 6.x — that's the version ESLint parses with. Package builds are unaffected.                     |
| Port `5432` already in use                                            | Another Postgres is running. Stop it, or change the port mapping in `docker-compose.yaml` to `"5433:5432"` and use `5433` in `DATABASE_URL`.     |
