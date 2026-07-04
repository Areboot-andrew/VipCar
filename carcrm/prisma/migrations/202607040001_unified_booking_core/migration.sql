ALTER TABLE "Booking"
ADD COLUMN "originLat" DOUBLE PRECISION,
ADD COLUMN "originLng" DOUBLE PRECISION,
ADD COLUMN "destinationLat" DOUBLE PRECISION,
ADD COLUMN "destinationLng" DOUBLE PRECISION,
ADD COLUMN "promotionId" TEXT,
ADD COLUMN "promoCode" TEXT,
ADD COLUMN "discountPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "returnToBaseAt" TIMESTAMP(3);

ALTER TABLE "Booking"
ADD CONSTRAINT "Booking_promotionId_fkey"
FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Booking_carId_carDispatchAt_returnToBaseAt_idx"
ON "Booking"("carId", "carDispatchAt", "returnToBaseAt");

CREATE INDEX "Booking_promotionId_idx"
ON "Booking"("promotionId");
