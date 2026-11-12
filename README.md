# editorial-tracker

# Setup

## 1. Install Node.js

Install the current LTS version from https://nodejs.org, or use a version manager such as `fnm` or `nvm`.

Check it works:

```bash
node -v
```

## 2. Install pnpm

```bash
npm install -g pnpm
```

Check it works:

```bash
pnpm -v
```

The exact pnpm version doesn't matter. `package.json` pins the version for this project (`devEngines.packageManager`), and pnpm downloads that version on its own when the one you have differs.

## 3. Install dependencies

From the repo root:

```bash
pnpm install
```

This installs all packages: `frontend`, `backend` and `shared`.

## 4. Approve build scripts (only when asked)

pnpm blocks dependencies from running install scripts unless they are approved. Approved packages are listed in `pnpm-workspace.yaml`, which is committed to the repo. A fresh clone needs no extra steps.

If `pnpm install` or `pnpm add` fails with `ERR_PNPM_IGNORED_BUILDS`:

1. Run:

   ```bash
   pnpm approve-builds
   ```

2. Select only the packages you trust (for example `esbuild`).
3. Run `pnpm install` again.
4. Commit the updated `pnpm-workspace.yaml` so others don't have to repeat this.

## 5. Run the apps

```bash
pnpm dev
```

## Troubleshooting

| Error                                                                 | Fix                                                                                        |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `Invalid package manager specification ... expected a semver version` | The pnpm version in `package.json` must be exact, e.g. `12.18.0`, not `^12.18.0`.          |
| `ERR_PNPM_IGNORED_BUILDS`                                             | See step 4.                                                                                |
| `pnpm: command not found`                                             | Open a new terminal after step 2, or check that npm's global bin folder is on your `PATH`. |

# workspace

using pnpm workspaces
