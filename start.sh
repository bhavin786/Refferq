#!/bin/sh
set -e

echo "DATABASE_URL is set: $([ -n "$DATABASE_URL" ] && echo YES || echo NO)"
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"

echo "Syncing database schema..."
prisma db push --accept-data-loss

echo "Starting server..."
exec node server.js
