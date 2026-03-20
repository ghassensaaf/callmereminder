-- CreateTable
CREATE TABLE IF NOT EXISTS "prompt_profiles" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "mode" VARCHAR(20) NOT NULL DEFAULT 'default',
  "custom_prompt" TEXT,
  "generated_prompt" TEXT,
  "business_name" VARCHAR(120),
  "industry" VARCHAR(120),
  "tone" VARCHAR(60),
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "prompt_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "prompt_profiles_userId_key" ON "prompt_profiles"("userId");
CREATE INDEX IF NOT EXISTS "prompt_profiles_userId_idx" ON "prompt_profiles"("userId");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'prompt_profiles_userId_fkey'
  ) THEN
    ALTER TABLE "prompt_profiles"
      ADD CONSTRAINT "prompt_profiles_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "user"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
