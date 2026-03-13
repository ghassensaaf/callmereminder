import { Router } from "express";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { validateVapiConfig } from "../services/vapi.js";

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
    res.json({
      vapiApiKey: settings.vapiApiKey ? "••••••••" : null,
      vapiPhoneNumberId: settings.vapiPhoneNumberId ?? null,
      hasVapiKeys: !!(settings.vapiApiKey && settings.vapiPhoneNumberId),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: err.message });
  }
});

router.put("/", requireAuth, async (req, res) => {
  try {
    const { vapiApiKey, vapiPhoneNumberId } = req.body;
    const apiKey = vapiApiKey?.trim() || null;
    const phoneId = vapiPhoneNumberId?.trim() || null;

    if (apiKey && phoneId) {
      const validation = await validateVapiConfig(apiKey, phoneId);
      if (!validation.valid) {
        return res.status(400).json({ detail: validation.error });
      }
    }

    const data = {};
    if (vapiApiKey !== undefined) data.vapiApiKey = apiKey;
    if (vapiPhoneNumberId !== undefined) data.vapiPhoneNumberId = phoneId;

    const settings = await prisma.userSettings.upsert({
      where: { userId: req.user.id },
      create: { userId: req.user.id, ...data },
      update: data,
    });
    res.json({
      vapiApiKey: settings.vapiApiKey ? "••••••••" : null,
      vapiPhoneNumberId: settings.vapiPhoneNumberId ?? null,
      hasVapiKeys: !!(settings.vapiApiKey && settings.vapiPhoneNumberId),
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
    await prisma.userSettings.upsert({
      where: { userId: req.user.id },
      create: { userId: req.user.id, vapiApiKey: null, vapiPhoneNumberId: null },
      update: { vapiApiKey: null, vapiPhoneNumberId: null },
    });
    res.json({
      vapiApiKey: null,
      vapiPhoneNumberId: null,
      hasVapiKeys: false,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: err.message });
  }
});

export default router;
