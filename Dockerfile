FROM node:26-slim AS workspace
RUN npm install -g pnpm@12.18.0
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/
COPY packages/backend/package.json packages/backend/
COPY packages/frontend/package.json packages/frontend/
COPY packages/backend/prisma packages/backend/prisma
COPY packages/backend/prisma.config.ts packages/backend/

FROM workspace AS setup
RUN pnpm install --frozen-lockfile --filter @editorial-tracker/backend... \
  && rm -rf "$(pnpm store path)" /root/.cache
COPY packages/shared packages/shared
COPY packages/backend packages/backend
WORKDIR /app/packages/backend
CMD ["sh", "-c", "pnpm db:push && pnpm db:seed"]

FROM workspace AS backend-dependencies
RUN pnpm install --frozen-lockfile --prod --ignore-scripts --filter @editorial-tracker/backend...

FROM node:26-slim AS backend
WORKDIR /app
COPY --from=backend-dependencies /app /app
COPY packages/shared packages/shared
COPY packages/backend packages/backend
COPY --from=setup /app/packages/backend/src/generated packages/backend/src/generated
WORKDIR /app/packages/backend
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node_modules/.bin/tsx", "src/index.ts"]

FROM workspace AS frontend-build
RUN pnpm install --frozen-lockfile --filter @editorial-tracker/frontend...
COPY packages/shared packages/shared
COPY packages/frontend packages/frontend
RUN pnpm --filter @editorial-tracker/frontend build

FROM nginx:1.27-alpine AS frontend
COPY packages/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=frontend-build /app/packages/frontend/dist /usr/share/nginx/html
