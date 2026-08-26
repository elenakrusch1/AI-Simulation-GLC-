#!/bin/sh
set -e

echo "[entrypoint] Applying database migrations..."
node node_modules/.bin/prisma migrate deploy

echo "[entrypoint] Starting application..."
# exec replaces this shell with the given command, so it becomes PID 1
# and receives SIGTERM/SIGINT directly — required for a clean shutdown.
exec "$@"
