import { Router } from "express";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { validateVapiConfig } from "../services/vapi.js";
import { ensureLegacyVapiMigrated, userHasOutboundLine } from "../lib/vapi-integration.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    let settings = await prisma.userSettings.findUnique({
      where: { userId: req.user.id },
    });
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: { userId: req.user.id },
      });
    }
    await ensureLegacyVapiMigrated(req.user.id);
    const hasVapiKeys = await userHasOutboundLine(req.user.id);
    res.json({
      vapiApiKeyDisplay: null,
      vapiPhoneNumberId: null,
      hasVapiKeys,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: err.message });
  }
});

/** @deprecated Use POST /api/vapi-configs. Only works when user has zero configs (bootstrap). */
router.put("/", requireAuth, async (req, res) => {
  try {
    await ensureLegacyVapiMigrated(req.user.id);
    const existing = await prisma.vapiConfig.count({ where: { userId: req.user.id } });
    if (existing > 0) {
      return res.status(400).json({
        detail: "Use Settings → Vapi integrations to manage API keys and numbers.",
      });
    }

    const { vapiApiKey, vapiPhoneNumberId } = req.body;
    const apiKey = vapiApiKey?.trim() || null;
    const phoneId = vapiPhoneNumberId?.trim() || null;

    if (!apiKey || !phoneId) {
      return res.status(400).json({ detail: "vapiApiKey and vapiPhoneNumberId are required" });
    }

    const validation = await validateVapiConfig(apiKey, phoneId);
    if (!validation.valid) {
      return res.status(400).json({ detail: validation.error });
    }

    await prisma.$transaction(async (tx) => {
      const config = await tx.vapiConfig.create({
        data: {
          userId: req.user.id,
          name: "Default",
          vapiApiKey: apiKey,
          isDefault: true,
        },
      });
      await tx.vapiPhoneNumber.create({
        data: {
          vapiConfigId: config.id,
          vapiPhoneNumberId: phoneId,
          nickname: "Primary",
          isDefault: true,
        },
      });
    });

    await prisma.userSettings.update({
      where: { userId: req.user.id },
      data: { vapiApiKey: null, vapiPhoneNumberId: null },
    });

    res.json({
      vapiApiKeyDisplay: "*****" + apiKey.slice(-5),
      vapiPhoneNumberId: phoneId,
      hasVapiKeys: true,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: err.message });
  }
});

router.post("/test", requireAuth, async (req, res) => {
  try {
    const { vapiApiKey, vapiPhoneNumberId } = req.body;
    const validation = await validateVapiConfig(vapiApiKey, vapiPhoneNumberId);
    if (validation.valid) {
      res.json({ valid: true });
    } else {
      res.status(400).json({ valid: false, error: validation.error });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ valid: false, error: err.message });
  }
});

router.delete("/", requireAuth, async (req, res) => {
  try {
    await prisma.vapiConfig.deleteMany({ where: { userId: req.user.id } });
    await prisma.userSettings.upsert({
      where: { userId: req.user.id },
      create: { userId: req.user.id, vapiApiKey: null, vapiPhoneNumberId: null },
      update: { vapiApiKey: null, vapiPhoneNumberId: null },
    });
    res.json({
      vapiApiKeyDisplay: null,
      vapiPhoneNumberId: null,
      hasVapiKeys: false,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: err.message });
  }
});

export default router;
