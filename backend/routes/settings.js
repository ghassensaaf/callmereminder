import { Router } from "express";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

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
    const data = {};
    if (vapiApiKey !== undefined) data.vapiApiKey = vapiApiKey?.trim() || null;
    if (vapiPhoneNumberId !== undefined) data.vapiPhoneNumberId = vapiPhoneNumberId?.trim() || null;

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

export default router;
