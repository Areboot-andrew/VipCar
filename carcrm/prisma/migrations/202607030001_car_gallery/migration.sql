ALTER TABLE "Car" ADD COLUMN IF NOT EXISTS "slug" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Car_slug_key" ON "Car"("slug");

ALTER TABLE "Car" ADD COLUMN IF NOT EXISTS "luggageCapacity" INTEGER NOT NULL DEFAULT 2;
ALTER TABLE "Car" ADD COLUMN IF NOT EXISTS "largeLuggageCapacity" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Car" ADD COLUMN IF NOT EXISTS "comfortClass" TEXT NOT NULL DEFAULT 'Premium';
ALTER TABLE "Car" ADD COLUMN IF NOT EXISTS "bodyType" TEXT;
ALTER TABLE "Car" ADD COLUMN IF NOT EXISTS "luggageNote" TEXT;
ALTER TABLE "Car" ADD COLUMN IF NOT EXISTS "seoTitle" TEXT;
ALTER TABLE "Car" ADD COLUMN IF NOT EXISTS "seoDescription" TEXT;
ALTER TABLE "Car" ADD COLUMN IF NOT EXISTS "defaultDriverId" TEXT;

CREATE TABLE IF NOT EXISTS "CarMedia" (
  "id" TEXT NOT NULL,
  "carId" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'image',
  "url" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'gallery',
  "title" TEXT,
  "alt" TEXT,
  "caption" TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  "isCover" BOOLEAN NOT NULL DEFAULT false,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "width" INTEGER,
  "height" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CarMedia_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CarMedia_carId_active_order_idx" ON "CarMedia"("carId", "active", "order");
CREATE INDEX IF NOT EXISTS "CarMedia_role_idx" ON "CarMedia"("role");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CarMedia_carId_fkey') THEN
    ALTER TABLE "CarMedia"
      ADD CONSTRAINT "CarMedia_carId_fkey"
      FOREIGN KEY ("carId") REFERENCES "Car"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Car_defaultDriverId_fkey') THEN
    ALTER TABLE "Car"
      ADD CONSTRAINT "Car_defaultDriverId_fkey"
      FOREIGN KEY ("defaultDriverId") REFERENCES "Driver"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
