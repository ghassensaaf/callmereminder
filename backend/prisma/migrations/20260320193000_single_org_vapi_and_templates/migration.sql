-- Single-org enforcement, org-scoped Vapi configs and reminder templates
-- DESTRUCTIVE: duplicate member rows (same user in multiple orgs) are removed (keeps earliest "createdAt").
-- DESTRUCTIVE: vapi_configs / reminder_templates rows that cannot be tied to an organization are deleted.

-- 1) Dedupe memberships: one row per user (keep oldest)
DELETE FROM "member"
WHERE "id" IN (
  SELECT "id" FROM (
    SELECT "id",
           ROW_NUMBER() OVER (PARTITION BY "userId" ORDER BY "createdAt" ASC) AS rn
    FROM "member"
  ) t
  WHERE t.rn > 1
);

-- 2) Enforce at most one membership per user
CREATE UNIQUE INDEX IF NOT EXISTS "member_userId_key" ON "member"("userId");

-- 3) Move Vapi configs from user to organization
ALTER TABLE "vapi_configs" ADD COLUMN IF NOT EXISTS "organization_id" TEXT;

UPDATE "vapi_configs" vc
SET "organization_id" = m."organizationId"
FROM "member" m
WHERE m."userId" = vc."user_id";

DELETE FROM "vapi_configs" WHERE "organization_id" IS NULL;

ALTER TABLE "vapi_configs" ALTER COLUMN "organization_id" SET NOT NULL;

ALTER TABLE "vapi_configs" DROP CONSTRAINT IF EXISTS "vapi_configs_user_id_fkey";
ALTER TABLE "vapi_configs" DROP COLUMN IF EXISTS "user_id";

DROP INDEX IF EXISTS "vapi_configs_user_id_idx";
CREATE INDEX IF NOT EXISTS "vapi_configs_organization_id_idx" ON "vapi_configs"("organization_id");

ALTER TABLE "vapi_configs" DROP CONSTRAINT IF EXISTS "vapi_configs_organization_id_fkey";
ALTER TABLE "vapi_configs" ADD CONSTRAINT "vapi_configs_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 4) Reminder templates: org-scoped (column was "userId" per Prisma)
ALTER TABLE "reminder_templates" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

UPDATE "reminder_templates" rt
SET "organizationId" = m."organizationId"
FROM "member" m
WHERE m."userId" = rt."userId";

DELETE FROM "reminder_templates" WHERE "organizationId" IS NULL;

ALTER TABLE "reminder_templates" ALTER COLUMN "organizationId" SET NOT NULL;

ALTER TABLE "reminder_templates" DROP CONSTRAINT IF EXISTS "reminder_templates_userId_fkey";
ALTER TABLE "reminder_templates" DROP COLUMN IF EXISTS "userId";

CREATE INDEX IF NOT EXISTS "reminder_templates_organizationId_idx" ON "reminder_templates"("organizationId");

ALTER TABLE "reminder_templates" DROP CONSTRAINT IF EXISTS "reminder_templates_organizationId_fkey";
ALTER TABLE "reminder_templates" ADD CONSTRAINT "reminder_templates_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
