FROM node:26-slim AS base
# node:26-slim ships npm only (no corepack), so npm bootstraps pnpm here.
# This is the only npm call; pnpm runs every command after it.
RUN npm install -g pnpm@12.18.0
WORKDIR /app

# Install deps first so Docker caches this layer
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/
COPY packages/backend/package.json packages/backend/
COPY packages/frontend/package.json packages/frontend/
RUN pnpm install --frozen-lockfile

COPY . .

# --- Express ---
FROM base AS backend
WORKDIR /app/packages/backend
ENV NODE_ENV=production
EXPOSE 3000
CMD ["./node_modules/.bin/tsx", "src/index.ts"]

# --- React build ---
FROM base AS frontend-build
RUN pnpm --filter @editorial-tracker/frontend build

# --- React served by nginx ---
FROM nginx:1.27-alpine AS frontend
COPY packages/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=frontend-build /app/packages/frontend/dist /usr/share/nginx/html