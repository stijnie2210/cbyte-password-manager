#!/bin/sh
set -e

echo "Waiting for PostgreSQL..."
until pg_isready -d "$DATABASE_URL" -q; do
  sleep 1
done
echo "PostgreSQL is ready."

echo "Applying database schema..."
npm run db:push -- --force

echo "Starting application..."
exec "$@"
