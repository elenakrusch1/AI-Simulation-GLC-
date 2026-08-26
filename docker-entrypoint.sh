#!/bin/sh
set -e

# Pre-flight: DATABASE_URL must point at a real, reachable Postgres.
# The most common deploy mistake is pasting the local/dev value into
# the hosting platform's env vars, which otherwise surfaces a few
# lines down as an opaque "P1001: Can't reach database server".
if [ -z "$DATABASE_URL" ]; then
  echo "[entrypoint] ERROR: DATABASE_URL is not set. Set it to your Postgres" >&2
  echo "[entrypoint]        connection string (on Render: the database's Internal" >&2
  echo "[entrypoint]        Database URL, or use the render.yaml blueprint) and redeploy." >&2
  exit 1
fi

case "$DATABASE_URL" in
  *@localhost:*|*@127.0.0.1:*|*@[::1]:*|*@db:*)
    echo "[entrypoint] NOTE: DATABASE_URL points at a local host (localhost /"
    echo "[entrypoint]       127.0.0.1 / the docker-compose 'db' service). That is"
    echo "[entrypoint]       correct for 'docker compose up' but WRONG on a hosting"
    echo "[entrypoint]       platform: there that address is THIS container, so the"
    echo "[entrypoint]       next step will fail with 'P1001: Can't reach database"
    echo "[entrypoint]       server'. On Render, set DATABASE_URL to the Postgres"
    echo "[entrypoint]       Internal Database URL (or apply render.yaml)."
    ;;
esac

echo "[entrypoint] Applying database migrations..."
node node_modules/.bin/prisma migrate deploy

# Both of the steps below are upserts by natural key (customer/
# technical-solution/commercial-model code, admin login identifier) —
# safe to run on every boot, including restarts and redeploys.

echo "[entrypoint] Seeding reference data (rounds, customers, technical solutions, commercial models)..."
node node_modules/.bin/tsx prisma/seed.ts || echo "[entrypoint] WARNING: seeding reference data failed — continuing startup anyway."

if [ -n "$ADMIN_LOGIN_IDENTIFIER" ] && [ -n "$ADMIN_PASSWORD" ]; then
  echo "[entrypoint] ADMIN_LOGIN_IDENTIFIER/ADMIN_PASSWORD are set — ensuring that admin account exists..."
  node node_modules/.bin/tsx scripts/seed-admin.ts || echo "[entrypoint] WARNING: admin seeding failed (check ADMIN_PASSWORD meets the password policy — 12+ chars, a letter, and a number) — continuing startup anyway."
else
  echo "[entrypoint] ADMIN_LOGIN_IDENTIFIER/ADMIN_PASSWORD not set — skipping automatic admin creation. Set both (see .env.example) to get an admin account on every boot, or run scripts/seed-admin.ts manually later."
fi

echo "[entrypoint] Starting application..."
# exec replaces this shell with the given command, so it becomes PID 1
# and receives SIGTERM/SIGINT directly — required for a clean shutdown.
exec "$@"
