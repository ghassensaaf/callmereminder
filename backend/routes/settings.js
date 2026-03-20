import { Router } from "express";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { validateVapiConfig } from "../services/vapi.js";
import { generateBusinessPrompt } from "../services/prompt-generator.js";
import { userHasOutboundLine } from "../lib/vapi-integration.js";

const router = Router();
const PROMPT_MODES = ["default", "custom", "generated"];

function formatPromptProfile(profile) {
  return {
    mode: profile?.mode || "default",
    customPrompt: profile?.customPrompt || "",
    generatedPrompt: profile?.generatedPrompt || "",
    businessName: profile?.businessName || "",
    industry: profile?.industry || "",
    tone: profile?.tone || "",
    notes: profile?.notes || "",
  };
}

router.get("/", requireAuth, async (req, res) => {
  try {
    const hasVapiKeys = await userHasOutboundLine(req.user.id);
    const promptProfile = await prisma.promptProfile.findUnique({
      where: { userId: req.user.id },
    });
    res.json({
      vapiApiKeyDisplay: null,
      vapiPhoneNumberId: null,
      hasVapiKeys,
      promptProfile: formatPromptProfile(promptProfile),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: err.message });
  }
});

/** @deprecated Use POST /api/vapi-configs. Only works when user has zero configs (bootstrap). */
router.put("/", requireAuth, async (req, res) => {
  try {
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

router.put("/prompt", requireAuth, async (req, res) => {
  try {
    const mode = (req.body.mode || "default").toLowerCase();
    if (!PROMPT_MODES.includes(mode)) {
      return res.status(400).json({ detail: "Invalid mode. Use default, custom, or generated." });
    }

    const customPrompt = (req.body.customPrompt || "").trim();
    const generatedPrompt = (req.body.generatedPrompt || "").trim();
    const businessName = (req.body.businessName || "").trim();
    const industry = (req.body.industry || "").trim();
    const tone = (req.body.tone || "").trim();
    const notes = (req.body.notes || "").trim();

    if (mode === "custom" && !customPrompt) {
      return res.status(400).json({ detail: "Custom mode requires a custom prompt." });
    }
    if (mode === "generated" && !generatedPrompt) {
      return res.status(400).json({ detail: "Generated mode requires a generated prompt." });
    }
    if (customPrompt.length > 4000 || generatedPrompt.length > 4000 || notes.length > 4000) {
      return res.status(400).json({ detail: "Prompt fields are too long." });
    }

    const profile = await prisma.promptProfile.upsert({
      where: { userId: req.user.id },
      create: {
        userId: req.user.id,
        mode,
        customPrompt: customPrompt || null,
        generatedPrompt: generatedPrompt || null,
        businessName: businessName || null,
        industry: industry || null,
        tone: tone || null,
        notes: notes || null,
      },
      update: {
        mode,
        customPrompt: customPrompt || null,
        generatedPrompt: generatedPrompt || null,
        businessName: businessName || null,
        industry: industry || null,
        tone: tone || null,
        notes: notes || null,
      },
    });

    res.json({ promptProfile: formatPromptProfile(profile) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: err.message });
  }
});

router.post("/prompt/generate", requireAuth, async (req, res) => {
  try {
    const businessName = (req.body.businessName || "").trim();
    const industry = (req.body.industry || "").trim();
    const tone = (req.body.tone || "").trim();
    const notes = (req.body.notes || "").trim();

    const generatedPrompt = await generateBusinessPrompt({ businessName, industry, tone, notes });
    if (!generatedPrompt?.trim()) {
      return res.status(502).json({ detail: "Could not generate prompt right now." });
    }

    const profile = await prisma.promptProfile.upsert({
      where: { userId: req.user.id },
      create: {
        userId: req.user.id,
        mode: "generated",
        generatedPrompt: generatedPrompt.trim(),
        businessName: businessName || null,
        industry: industry || null,
        tone: tone || null,
        notes: notes || null,
      },
      update: {
        generatedPrompt: generatedPrompt.trim(),
        businessName: businessName || null,
        industry: industry || null,
        tone: tone || null,
        notes: notes || null,
      },
    });

    res.json({
      generatedPrompt: profile.generatedPrompt,
      promptProfile: formatPromptProfile(profile),
      provider: process.env.OPENROUTER_API_KEY ? "openrouter" : "fallback-template",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: err.message });
  }
});

router.delete("/", requireAuth, async (req, res) => {
  try {
    await prisma.vapiConfig.deleteMany({ where: { userId: req.user.id } });
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
