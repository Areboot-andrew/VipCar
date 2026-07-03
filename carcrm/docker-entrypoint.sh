#!/bin/sh
set -e

AUTO_MIGRATE="${AUTO_MIGRATE:-true}"
AUTO_DEMO_SEED="${AUTO_DEMO_SEED:-true}"
DB_WAIT_SECONDS="${DB_WAIT_SECONDS:-90}"

echo "Waiting for database connection..."
elapsed=0
until node -e 'const { PrismaClient } = require("@prisma/client"); const prisma = new PrismaClient(); prisma.$queryRawUnsafe("SELECT 1").then(() => prisma.$disconnect()).catch((error) => { console.error(error.message); process.exit(1); });' >/dev/null 2>&1; do
  elapsed=$((elapsed + 2))
  if [ "$elapsed" -ge "$DB_WAIT_SECONDS" ]; then
    echo "Database is not reachable after ${DB_WAIT_SECONDS}s."
    exit 1
  fi
  echo "Database is not ready yet (${elapsed}s/${DB_WAIT_SECONDS}s)."
  sleep 2
done
echo "Database is reachable."

if [ "$AUTO_MIGRATE" = "true" ]; then
  echo "Applying Prisma migrations..."
  npx prisma migrate deploy
else
  echo "AUTO_MIGRATE is disabled; skipping migrations."
fi

if [ "$AUTO_DEMO_SEED" = "true" ]; then
  echo "Applying demo seed if needed..."
  AUTO_DEMO_SEED=true npm run demo:seed
else
  echo "AUTO_DEMO_SEED is disabled; skipping demo seed."
fi

echo "Starting Next.js..."
exec "$@"
