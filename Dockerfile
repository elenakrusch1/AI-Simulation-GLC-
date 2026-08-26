# Data Center Deal Simulation — production image
#
# Base image is Debian "slim" rather than Alpine: Prisma's native
# query engine binary targets glibc, and while it does work on Alpine
# via the libc6-compat shim, slim avoids that shim entirely and is
# the base Prisma's own docs recommend when in doubt.
#
# Stages:
#   base       shared Node base with the native libs Prisma's query
#              engine needs
#   deps       full (dev+prod) install, used to build the app and to
#              generate the Prisma client
#   builder    compiles the Next.js app (standalone output)
#   prod-deps  a SEPARATE production-only install (npm ci --omit=dev),
#              so devDependencies never end up in the final image
#   runner     the actual image that ships: non-root user, only the
#              compiled app + prod node_modules + prisma schema/
#              migrations/seed scripts (needed for `prisma migrate
#              deploy` and the seed:admin CLI at runtime)

FROM node:20-bookworm-slim AS base
WORKDIR /app
# openssl: required by Prisma's query engine.
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts
RUN npm ci

FROM base AS builder
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# `next build` does not need a live database connection — every route
# that reads from the database is either behind an auth check or
# explicitly `export const dynamic = "force-dynamic"` (see
# src/app/leaderboard/page.tsx), so nothing gets prerendered against
# a real connection. This placeholder only satisfies schema/env
# validation during the build.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
RUN npm run build

FROM base AS prod-deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts
RUN npm ci --omit=dev

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

# Every COPY below chowns to nextjs:nodejs at copy time (--chown)
# instead of one recursive `chown -R /app` pass at the end — that
# alternative touches every file in node_modules a second time and is
# noticeably slower, especially on Docker Desktop for Windows/macOS.

# Production dependencies (includes the `prisma` CLI + `tsx`, kept as
# regular dependencies specifically so `prisma migrate deploy` and the
# seed:admin script can run inside this image).
COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# Compiled Next.js server (standalone) — copied piece by piece rather
# than the whole .next/standalone directory so it layers on top of
# the prod node_modules above instead of shipping its own trimmed
# (and here, unnecessary) copy.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone/server.js ./server.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Source needed at runtime for migrations and the admin-seed CLI
# (tsx runs these directly from TypeScript source — no separate build
# step for one-off ops scripts).
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/src ./src
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json ./tsconfig.json
COPY --chown=nextjs:nodejs package.json ./package.json

COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

ENTRYPOINT ["./docker-entrypoint.sh"]
# `node server.js` directly (not `npm start`) so it runs as PID 1 and
# receives SIGTERM/SIGINT directly for a clean shutdown.
CMD ["node", "server.js"]
