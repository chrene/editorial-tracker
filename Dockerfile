FROM node:26-slim AS base
RUN npm install -g pnpm@12.18.0
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/
COPY packages/backend/package.json packages/backend/
COPY packages/frontend/package.json packages/frontend/

COPY packages/backend/prisma packages/backend/prisma
COPY packages/backend/prisma.config.ts packages/backend/

RUN pnpm install --frozen-lockfile

COPY . .

FROM base AS backend
WORKDIR /app/packages/backend
ENV NODE_ENV=production
EXPOSE 3000
CMD ["./node_modules/.bin/tsx", "src/index.ts"]

FROM base AS frontend-build
RUN pnpm --filter @editorial-tracker/frontend build

FROM nginx:1.27-alpine AS frontend
COPY packages/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=frontend-build /app/packages/frontend/dist /usr/share/nginx/html
