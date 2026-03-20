-- CreateTable
CREATE TABLE IF NOT EXISTS "vapi_configs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "vapi_api_key" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vapi_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "vapi_phone_numbers" (
    "id" TEXT NOT NULL,
    "vapi_config_id" TEXT NOT NULL,
    "vapi_phone_number_id" VARCHAR(255) NOT NULL,
    "nickname" VARCHAR(100) NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vapi_phone_numbers_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "reminders" ADD COLUMN IF NOT EXISTS "vapi_line_id" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "vapi_configs_user_id_idx" ON "vapi_configs"("user_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "vapi_phone_numbers_vapi_config_id_idx" ON "vapi_phone_numbers"("vapi_config_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "reminders_vapi_line_id_idx" ON "reminders"("vapi_line_id");

-- AddForeignKey
ALTER TABLE "vapi_configs" DROP CONSTRAINT IF EXISTS "vapi_configs_user_id_fkey";
ALTER TABLE "vapi_configs" ADD CONSTRAINT "vapi_configs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "vapi_phone_numbers" DROP CONSTRAINT IF EXISTS "vapi_phone_numbers_vapi_config_id_fkey";
ALTER TABLE "vapi_phone_numbers" ADD CONSTRAINT "vapi_phone_numbers_vapi_config_id_fkey" FOREIGN KEY ("vapi_config_id") REFERENCES "vapi_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reminders" DROP CONSTRAINT IF EXISTS "reminders_vapi_line_id_fkey";
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_vapi_line_id_fkey" FOREIGN KEY ("vapi_line_id") REFERENCES "vapi_phone_numbers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "vapi_phone_numbers_vapi_config_id_vapi_phone_number_id_key" ON "vapi_phone_numbers"("vapi_config_id", "vapi_phone_number_id");
