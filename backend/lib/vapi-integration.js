import prisma from "./prisma.js";

/**
 * One-time migration from user_settings.vapi* to VapiConfig + VapiPhoneNumber.
 */
export async function ensureLegacyVapiMigrated(userId) {
  const existing = await prisma.vapiConfig.count({ where: { userId } });
  if (existing > 0) return;

  const legacy = await prisma.userSettings.findUnique({ where: { userId } });
  if (!legacy?.vapiApiKey?.trim() || !legacy?.vapiPhoneNumberId?.trim()) return;

  await prisma.$transaction(async (tx) => {
    const config = await tx.vapiConfig.create({
      data: {
        userId,
        name: "Default",
        vapiApiKey: legacy.vapiApiKey.trim(),
        isDefault: true,
      },
    });
    const line = await tx.vapiPhoneNumber.create({
      data: {
        vapiConfigId: config.id,
        vapiPhoneNumberId: legacy.vapiPhoneNumberId.trim(),
        nickname: "Primary",
        isDefault: true,
      },
    });
    await tx.reminder.updateMany({
      where: { userId, vapiLineId: null },
      data: { vapiLineId: line.id },
    });
    await tx.userSettings.update({
      where: { userId },
      data: { vapiApiKey: null, vapiPhoneNumberId: null },
    });
  });
}

export async function userHasOutboundLine(userId) {
  await ensureLegacyVapiMigrated(userId);
  const n = await prisma.vapiPhoneNumber.count({
    where: { config: { userId } },
  });
  return n > 0;
}

/**
 * Default outbound line: default config's default number, else first default number, else first line.
 * @returns {Promise<{ lineId: string, vapiPhoneNumberId: string, apiKey: string } | null>}
 */
export async function getDefaultOutboundLine(userId) {
  await ensureLegacyVapiMigrated(userId);

  const defaultConfig = await prisma.vapiConfig.findFirst({
    where: { userId, isDefault: true },
    include: {
      numbers: { orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] },
    },
  });

  const pickFromConfig = (config) => {
    if (!config?.numbers?.length) return null;
    const def = config.numbers.find((n) => n.isDefault) ?? config.numbers[0];
    return {
      lineId: def.id,
      vapiPhoneNumberId: def.vapiPhoneNumberId,
      apiKey: config.vapiApiKey,
    };
  };

  if (defaultConfig) {
    const picked = pickFromConfig(defaultConfig);
    if (picked) return picked;
  }

  const anyConfig = await prisma.vapiConfig.findFirst({
    where: { userId },
    include: {
      numbers: { orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] },
    },
    orderBy: { createdAt: "asc" },
  });
  return pickFromConfig(anyConfig);
}

/**
 * For scheduled dial: use reminder's line, or fall back to the user's default line if missing/stale.
 * @returns {Promise<{ lineId: string, vapiPhoneNumberId: string, apiKey: string } | null>}
 */
export async function resolveLineForDial(userId, vapiLineId) {
  await ensureLegacyVapiMigrated(userId);
  if (vapiLineId?.trim()) {
    const line = await prisma.vapiPhoneNumber.findFirst({
      where: { id: vapiLineId.trim(), config: { userId } },
      include: { config: true },
    });
    if (line) {
      return {
        lineId: line.id,
        vapiPhoneNumberId: line.vapiPhoneNumberId,
        apiKey: line.config.vapiApiKey,
      };
    }
  }
  return getDefaultOutboundLine(userId);
}

/**
 * Verify vapi_line_id belongs to user; if null/omit and user has lines, use default.
 * @returns {{ ok: true, vapiLineId: string | null } | { ok: false, detail: string }}
 */
export async function assertOrResolveVapiLine(userId, vapiLineId) {
  await ensureLegacyVapiMigrated(userId);
  const hasLines = (await prisma.vapiPhoneNumber.count({ where: { config: { userId } } })) > 0;
  if (!hasLines) {
    return { ok: true, vapiLineId: null };
  }
  if (!vapiLineId?.trim()) {
    const d = await getDefaultOutboundLine(userId);
    if (!d) {
      return { ok: false, detail: "Add a validated caller number to a Vapi config in Settings." };
    }
    return { ok: true, vapiLineId: d.lineId };
  }
  const line = await prisma.vapiPhoneNumber.findFirst({
    where: { id: vapiLineId.trim(), config: { userId } },
  });
  if (!line) {
    return {
      ok: false,
      detail: "Invalid outbound line. Pick a caller profile in Settings or on this reminder.",
    };
  }
  return { ok: true, vapiLineId: line.id };
}

export async function unsetOtherDefaultConfigs(tx, userId, keepConfigId) {
  await tx.vapiConfig.updateMany({
    where: { userId, id: { not: keepConfigId }, isDefault: true },
    data: { isDefault: false },
  });
}

export async function unsetOtherDefaultNumbers(tx, vapiConfigId, keepNumberId) {
  const where = { vapiConfigId, isDefault: true };
  if (keepNumberId) where.id = { not: keepNumberId };
  await tx.vapiPhoneNumber.updateMany({ where, data: { isDefault: false } });
}

export async function promoteOtherDefaultNumber(tx, vapiConfigId, excludeId) {
  const next = await tx.vapiPhoneNumber.findFirst({
    where: { vapiConfigId, id: { not: excludeId } },
    orderBy: { createdAt: "asc" },
  });
  if (next) {
    await tx.vapiPhoneNumber.update({
      where: { id: next.id },
      data: { isDefault: true },
    });
  }
}
