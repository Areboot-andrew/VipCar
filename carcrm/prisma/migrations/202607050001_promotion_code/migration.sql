-- Promo codes managed from the admin panel (replaces the hardcoded vip10)
ALTER TABLE "Promotion" ADD COLUMN "code" TEXT;

CREATE UNIQUE INDEX "Promotion_code_key" ON "Promotion"("code");
