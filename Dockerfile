# ---------- Base ----------
FROM node:22-alpine AS base
WORKDIR /app
ENV CI=true
RUN corepack enable && corepack prepare pnpm@11.11.0 --activate

# ---------- Dependencies ----------
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ---------- Build ----------
FROM deps AS build
COPY . .
RUN pnpm run build

# ---------- Runtime ----------
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PATH="/app/node_modules/.bin:${PATH}"

# Non-root user for safety
RUN addgroup -S nodejs && adduser -S nestjs -G nodejs

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/src/database/schema.ts ./src/database/schema.ts

USER nestjs

EXPOSE 3000

CMD ["sh", "-c", "drizzle-kit migrate --config=drizzle.config.ts && node dist/main"]