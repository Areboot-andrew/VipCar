-- Personal loyalty discount per client
ALTER TABLE "User"
ADD COLUMN "personalDiscountPercent" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Deposit and payment tracking on invoices
ALTER TABLE "Invoice"
ADD COLUMN "depositAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "paidAt" TIMESTAMP(3),
ADD COLUMN "paymentMethod" TEXT;

-- Admin overrides for auto-generated Empty Leg promos
CREATE TABLE "EmptyLegOverride" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "discount" DOUBLE PRECISION,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmptyLegOverride_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmptyLegOverride_bookingId_key" ON "EmptyLegOverride"("bookingId");
