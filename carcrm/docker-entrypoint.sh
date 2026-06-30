#!/bin/sh
set -e

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Seeding the database..."
npx tsx prisma/seed.ts

echo "Starting Next.js..."
exec "$@"
