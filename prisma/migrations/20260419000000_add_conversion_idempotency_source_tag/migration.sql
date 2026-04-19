-- AlterTable: add idempotencyKey + sourceTag to conversions
ALTER TABLE "conversions" ADD COLUMN "idempotency_key" TEXT;
ALTER TABLE "conversions" ADD COLUMN "source_tag" TEXT NOT NULL DEFAULT 'default';
CREATE UNIQUE INDEX "conversions_idempotency_key_key" ON "conversions"("idempotency_key");

-- AlterTable: add sourceTag to program_settings
ALTER TABLE "program_settings" ADD COLUMN "source_tag" TEXT NOT NULL DEFAULT 'default';
