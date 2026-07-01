#!/bin/sh
set -e

echo "Pushing Prisma schema to database..."
npx prisma db push --accept-data-loss --skip-generate

echo "Seeding the database..."
npx prisma db seed

echo "Starting Next.js..."
exec "$@"
