#!/bin/sh
set -e

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
