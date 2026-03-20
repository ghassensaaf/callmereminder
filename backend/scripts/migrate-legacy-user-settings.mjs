/**
 * One-time migration: copy Vapi credentials from legacy `user_settings` into
 * `vapi_configs` / `vapi_phone_numbers` for users with no configs yet.
 *
 * Run against a database that still has `user_settings`, before or after the
 * Prisma schema removes the UserSettings model (raw SQL still works if the table exists):
 *
 *   node scripts/migrate-legacy-user-settings.mjs
 *
 * Then apply schema / `npx prisma db push` which drops `user_settings`.
 *
 * Vapi configs are org-scoped: uses the user's (single) organization membership.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  let rows;
  try {
    rows = await prisma.$queryRaw`
      SELECT "userId", "vapiApiKey", "vapiPhoneNumberId"
      FROM user_settings
      WHERE "vapiApiKey" IS NOT NULL
        AND trim("vapiApiKey") <> ''
        AND "vapiPhoneNumberId" IS NOT NULL
        AND trim("vapiPhoneNumberId") <> ''
    `;
  } catch (e) {
    if (e?.code === "42P01" || String(e?.message || "").includes("user_settings")) {
      console.log("Table user_settings does not exist — nothing to migrate.");
      return;
    }
    throw e;
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    console.log("No legacy Vapi rows in user_settings.");
    return;
  }

  for (const row of rows) {
    const userId = row.userId;
    const membership = await prisma.member.findUnique({ where: { userId } });
    if (!membership) {
      console.log(`Skip user ${userId}: no organization membership`);
      continue;
    }
    const organizationId = membership.organizationId;
    const existing = await prisma.vapiConfig.count({ where: { organizationId } });
    if (existing > 0) {
      console.log(`Skip org ${organizationId}: already has vapi_configs`);
      continue;
    }

    await prisma.$transaction(async (tx) => {
      const config = await tx.vapiConfig.create({
        data: {
          organizationId,
          name: "Default",
          vapiApiKey: String(row.vapiApiKey).trim(),
          isDefault: true,
        },
      });
      const line = await tx.vapiPhoneNumber.create({
        data: {
          vapiConfigId: config.id,
          vapiPhoneNumberId: String(row.vapiPhoneNumberId).trim(),
          nickname: "Primary",
          isDefault: true,
        },
      });
      await tx.reminder.updateMany({
        where: { userId, vapiLineId: null },
        data: { vapiLineId: line.id },
      });
    });
    console.log(`Migrated legacy Vapi for user ${userId} (org ${organizationId})`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
