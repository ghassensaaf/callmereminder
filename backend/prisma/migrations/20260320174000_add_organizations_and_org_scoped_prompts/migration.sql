-- Better Auth organization plugin tables + org-scoped prompt profiles

-- 1) Core organization tables
CREATE TABLE IF NOT EXISTS "organization" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "logo" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3),
  CONSTRAINT "organization_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "organization_slug_key" ON "organization"("slug");

CREATE TABLE IF NOT EXISTS "member" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'member',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "member_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "member_organizationId_userId_key" ON "member"("organizationId", "userId");
CREATE INDEX IF NOT EXISTS "member_organizationId_idx" ON "member"("organizationId");
CREATE INDEX IF NOT EXISTS "member_userId_idx" ON "member"("userId");

CREATE TABLE IF NOT EXISTS "team" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3),
  CONSTRAINT "team_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "team_organizationId_idx" ON "team"("organizationId");

CREATE TABLE IF NOT EXISTS "teamMember" (
  "id" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "teamMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "teamMember_teamId_userId_key" ON "teamMember"("teamId", "userId");
CREATE INDEX IF NOT EXISTS "teamMember_teamId_idx" ON "teamMember"("teamId");
CREATE INDEX IF NOT EXISTS "teamMember_userId_idx" ON "teamMember"("userId");

CREATE TABLE IF NOT EXISTS "invitation" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "inviterId" TEXT NOT NULL,
  "teamId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "invitation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "invitation_organizationId_idx" ON "invitation"("organizationId");
CREATE INDEX IF NOT EXISTS "invitation_email_idx" ON "invitation"("email");
CREATE INDEX IF NOT EXISTS "invitation_inviterId_idx" ON "invitation"("inviterId");

-- 2) Session columns required by organization plugin
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "activeOrganizationId" TEXT;
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "activeTeamId" TEXT;

-- 3) Ensure each existing user has a personal organization membership (safe baseline)
INSERT INTO "organization" ("id", "name", "slug", "createdAt")
SELECT
  'org_' || SUBSTRING(MD5(u.id), 1, 20),
  COALESCE(NULLIF(u.name, ''), 'Organization'),
  'org-' || SUBSTRING(MD5(u.id), 1, 12),
  CURRENT_TIMESTAMP
FROM "user" u
LEFT JOIN "member" m ON m."userId" = u.id
WHERE m.id IS NULL
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "member" ("id", "organizationId", "userId", "role", "createdAt")
SELECT
  'mem_' || SUBSTRING(MD5(u.id), 1, 20),
  o.id,
  u.id,
  'owner',
  CURRENT_TIMESTAMP
FROM "user" u
JOIN "organization" o ON o."slug" = 'org-' || SUBSTRING(MD5(u.id), 1, 12)
LEFT JOIN "member" m ON m."organizationId" = o.id AND m."userId" = u.id
WHERE m.id IS NULL
ON CONFLICT ("organizationId", "userId") DO NOTHING;

-- 4) Prompt profile transition: user-scoped -> organization-scoped
ALTER TABLE "prompt_profiles" ADD COLUMN IF NOT EXISTS "organization_id" TEXT;

UPDATE "prompt_profiles" pp
SET "organization_id" = sub."organizationId"
FROM (
  SELECT DISTINCT ON (m."userId")
    m."userId",
    m."organizationId"
  FROM "member" m
  ORDER BY m."userId", m."createdAt" ASC
) sub
WHERE pp."organization_id" IS NULL
  AND pp."userId" = sub."userId";

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'prompt_profiles'
      AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE "prompt_profiles"
      ALTER COLUMN "organization_id" SET NOT NULL;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "prompt_profiles_organization_id_key" ON "prompt_profiles"("organization_id");
CREATE INDEX IF NOT EXISTS "prompt_profiles_organization_id_idx" ON "prompt_profiles"("organization_id");

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'prompt_profiles_userId_fkey'
  ) THEN
    ALTER TABLE "prompt_profiles" DROP CONSTRAINT "prompt_profiles_userId_fkey";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'prompt_profiles_organization_id_fkey'
  ) THEN
    ALTER TABLE "prompt_profiles" DROP CONSTRAINT "prompt_profiles_organization_id_fkey";
  END IF;
  ALTER TABLE "prompt_profiles"
    ADD CONSTRAINT "prompt_profiles_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organization"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
END $$;

DROP INDEX IF EXISTS "prompt_profiles_userId_key";
DROP INDEX IF EXISTS "prompt_profiles_userId_idx";

ALTER TABLE "prompt_profiles" DROP COLUMN IF EXISTS "userId";

-- 5) Foreign keys for org tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'member_organizationId_fkey'
  ) THEN
    ALTER TABLE "member"
      ADD CONSTRAINT "member_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "organization"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'member_userId_fkey'
  ) THEN
    ALTER TABLE "member"
      ADD CONSTRAINT "member_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "user"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'team_organizationId_fkey'
  ) THEN
    ALTER TABLE "team"
      ADD CONSTRAINT "team_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "organization"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'teamMember_teamId_fkey'
  ) THEN
    ALTER TABLE "teamMember"
      ADD CONSTRAINT "teamMember_teamId_fkey"
      FOREIGN KEY ("teamId") REFERENCES "team"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'teamMember_userId_fkey'
  ) THEN
    ALTER TABLE "teamMember"
      ADD CONSTRAINT "teamMember_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "user"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'invitation_organizationId_fkey'
  ) THEN
    ALTER TABLE "invitation"
      ADD CONSTRAINT "invitation_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "organization"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'invitation_inviterId_fkey'
  ) THEN
    ALTER TABLE "invitation"
      ADD CONSTRAINT "invitation_inviterId_fkey"
      FOREIGN KEY ("inviterId") REFERENCES "user"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'invitation_teamId_fkey'
  ) THEN
    ALTER TABLE "invitation"
      ADD CONSTRAINT "invitation_teamId_fkey"
      FOREIGN KEY ("teamId") REFERENCES "team"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
