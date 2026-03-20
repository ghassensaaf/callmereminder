import { Router } from "express";
import prisma from "../lib/prisma.js";
import { requireAuth, requireOrg, requireOrgRole } from "../middleware/auth.js";
import { validateVapiConfig } from "../services/vapi.js";
import {
  unsetOtherDefaultConfigs,
  unsetOtherDefaultNumbers,
  promoteOtherDefaultNumber,
} from "../lib/vapi-integration.js";

const router = Router();

function maskKey(key) {
  if (!key?.length) return null;
  return "*****" + key.slice(-5);
}

function formatConfig(c) {
  return {
    id: c.id,
    name: c.name,
    api_key_masked: maskKey(c.vapiApiKey),
    is_default: c.isDefault,
    numbers: (c.numbers ?? []).map((n) => ({
      id: n.id,
      vapi_phone_number_id: n.vapiPhoneNumberId,
      nickname: n.nickname,
      is_default: n.isDefault,
    })),
  };
}

router.use(requireAuth);
router.use(requireOrg);

router.get("/", async (req, res) => {
  try {
    const orgId = req.organizationId;
    const configs = await prisma.vapiConfig.findMany({
      where: { organizationId: orgId },
      include: { numbers: { orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] } },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    });
    const defaultConfig = configs.find((c) => c.isDefault) ?? configs[0];
    let default_line_id = null;
    if (defaultConfig?.numbers?.length) {
      const dn = defaultConfig.numbers.find((n) => n.isDefault) ?? defaultConfig.numbers[0];
      default_line_id = dn.id;
    }
    res.json({
      configs: configs.map(formatConfig),
      default_line_id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: err.message });
  }
});

router.post("/", requireOrgRole("owner", "admin"), async (req, res) => {
  try {
    const orgId = req.organizationId;
    const name = req.body.name?.trim();
    const vapiApiKey = req.body.vapiApiKey?.trim();
    if (!name || !vapiApiKey) {
      return res.status(400).json({ detail: "name and vapiApiKey are required" });
    }

    const count = await prisma.vapiConfig.count({ where: { organizationId: orgId } });
    const shouldBeDefault = count === 0 || req.body.is_default === true;

    const config = await prisma.$transaction(async (tx) => {
      if (shouldBeDefault) {
        await tx.vapiConfig.updateMany({
          where: { organizationId: orgId, isDefault: true },
          data: { isDefault: false },
        });
      }
      return tx.vapiConfig.create({
        data: {
          organizationId: orgId,
          name: name.slice(0, 100),
          vapiApiKey,
          isDefault: shouldBeDefault,
        },
      });
    });

    const full = await prisma.vapiConfig.findUnique({
      where: { id: config.id },
      include: { numbers: { orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] } },
    });
    res.status(201).json(formatConfig(full));
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: err.message });
  }
});

router.patch("/numbers/:numberId", requireOrgRole("owner", "admin"), async (req, res) => {
  try {
    const orgId = req.organizationId;
    const numberId = req.params.numberId;
    const existing = await prisma.vapiPhoneNumber.findFirst({
      where: { id: numberId, config: { organizationId: orgId } },
      include: { config: true },
    });
    if (!existing) return res.status(404).json({ detail: "Number not found" });

    const nickname = req.body.nickname !== undefined ? req.body.nickname?.trim() : undefined;
    if (nickname !== undefined && !nickname) {
      return res.status(400).json({ detail: "nickname cannot be empty" });
    }

    const setDefault = req.body.set_default === true;

    await prisma.$transaction(async (tx) => {
      if (setDefault) {
        await unsetOtherDefaultNumbers(tx, existing.vapiConfigId, existing.id);
      }
      const data = {};
      if (setDefault) data.isDefault = true;
      if (nickname !== undefined) data.nickname = nickname.slice(0, 100);
      if (Object.keys(data).length) {
        await tx.vapiPhoneNumber.update({ where: { id: existing.id }, data });
      }
    });

    const full = await prisma.vapiConfig.findUnique({
      where: { id: existing.vapiConfigId },
      include: { numbers: { orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] } },
    });
    res.json(formatConfig(full));
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: err.message });
  }
});

router.delete("/numbers/:numberId", requireOrgRole("owner", "admin"), async (req, res) => {
  try {
    const orgId = req.organizationId;
    const numberId = req.params.numberId;
    const existing = await prisma.vapiPhoneNumber.findFirst({
      where: { id: numberId, config: { organizationId: orgId } },
    });
    if (!existing) return res.status(404).json({ detail: "Number not found" });

    const configId = existing.vapiConfigId;
    const wasDefault = existing.isDefault;

    await prisma.vapiPhoneNumber.delete({ where: { id: numberId } });

    if (wasDefault) {
      await prisma.$transaction(async (tx) => {
        await promoteOtherDefaultNumber(tx, configId, numberId);
      });
    }

    const full = await prisma.vapiConfig.findUnique({
      where: { id: configId },
      include: { numbers: { orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] } },
    });
    res.json(formatConfig(full));
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: err.message });
  }
});

router.patch("/:configId", requireOrgRole("owner", "admin"), async (req, res) => {
  try {
    const orgId = req.organizationId;
    const configId = req.params.configId;
    const existing = await prisma.vapiConfig.findFirst({
      where: { id: configId, organizationId: orgId },
      include: { numbers: true },
    });
    if (!existing) return res.status(404).json({ detail: "Config not found" });

    const name = req.body.name !== undefined ? req.body.name?.trim() : undefined;
    const vapiApiKey = req.body.vapiApiKey !== undefined ? req.body.vapiApiKey?.trim() || null : undefined;

    if (name !== undefined && !name) {
      return res.status(400).json({ detail: "name cannot be empty" });
    }

    if (vapiApiKey) {
      for (const n of existing.numbers) {
        const v = await validateVapiConfig(vapiApiKey, n.vapiPhoneNumberId);
        if (!v.valid) {
          return res.status(400).json({
            detail: `New API key does not work with number "${n.nickname}": ${v.error}`,
          });
        }
      }
    }

    const data = {};
    if (name !== undefined) data.name = name.slice(0, 100);
    if (vapiApiKey !== undefined && vapiApiKey) data.vapiApiKey = vapiApiKey;

    const updated = await prisma.vapiConfig.update({
      where: { id: configId },
      data,
      include: { numbers: { orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] } },
    });
    res.json(formatConfig(updated));
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: err.message });
  }
});

router.delete("/:configId", requireOrgRole("owner", "admin"), async (req, res) => {
  try {
    const orgId = req.organizationId;
    const configId = req.params.configId;
    const existing = await prisma.vapiConfig.findFirst({
      where: { id: configId, organizationId: orgId },
    });
    if (!existing) return res.status(404).json({ detail: "Config not found" });

    await prisma.vapiConfig.delete({ where: { id: configId } });

    const remaining = await prisma.vapiConfig.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "asc" },
    });
    if (remaining.length && !remaining.some((c) => c.isDefault)) {
      await prisma.vapiConfig.updateMany({
        where: { organizationId: orgId },
        data: { isDefault: false },
      });
      await prisma.vapiConfig.update({
        where: { id: remaining[0].id },
        data: { isDefault: true },
      });
    }

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: err.message });
  }
});

router.post("/:configId/set-default", requireOrgRole("owner", "admin"), async (req, res) => {
  try {
    const orgId = req.organizationId;
    const configId = req.params.configId;
    const existing = await prisma.vapiConfig.findFirst({
      where: { id: configId, organizationId: orgId },
      include: { numbers: { orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] } },
    });
    if (!existing) return res.status(404).json({ detail: "Config not found" });

    await prisma.$transaction(async (tx) => {
      await unsetOtherDefaultConfigs(tx, orgId, configId);
      await tx.vapiConfig.update({ where: { id: configId }, data: { isDefault: true } });
    });

    const full = await prisma.vapiConfig.findUnique({
      where: { id: configId },
      include: { numbers: { orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] } },
    });
    res.json(formatConfig(full));
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: err.message });
  }
});

router.post("/:configId/numbers", requireOrgRole("owner", "admin"), async (req, res) => {
  try {
    const orgId = req.organizationId;
    const configId = req.params.configId;
    const config = await prisma.vapiConfig.findFirst({
      where: { id: configId, organizationId: orgId },
      include: { numbers: true },
    });
    if (!config) return res.status(404).json({ detail: "Config not found" });

    const vapiPhoneNumberId = req.body.vapiPhoneNumberId?.trim();
    const nickname = req.body.nickname?.trim() || "Line";
    if (!vapiPhoneNumberId) {
      return res.status(400).json({ detail: "vapiPhoneNumberId is required" });
    }

    const dup = config.numbers.some((n) => n.vapiPhoneNumberId === vapiPhoneNumberId);
    if (dup) {
      return res.status(400).json({ detail: "This Vapi number ID is already on this config" });
    }

    const validation = await validateVapiConfig(config.vapiApiKey, vapiPhoneNumberId);
    if (!validation.valid) {
      return res.status(400).json({ detail: validation.error });
    }

    const isFirst = config.numbers.length === 0;
    const makeDefault = isFirst || req.body.is_default === true;

    await prisma.$transaction(async (tx) => {
      if (makeDefault) {
        await tx.vapiPhoneNumber.updateMany({
          where: { vapiConfigId: configId },
          data: { isDefault: false },
        });
      }
      await tx.vapiPhoneNumber.create({
        data: {
          vapiConfigId: configId,
          vapiPhoneNumberId,
          nickname: nickname.slice(0, 100),
          isDefault: makeDefault,
        },
      });
    });

    const full = await prisma.vapiConfig.findUnique({
      where: { id: configId },
      include: { numbers: { orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] } },
    });
    res.status(201).json(formatConfig(full));
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: err.message });
  }
});

export default router;
