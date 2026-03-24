import { Router } from "express";
import prisma from "../lib/prisma.js";
import { requireAuth, requireOrg, requireOrgRole } from "../middleware/auth.js";
import { generateRawPublicApiKey, getPublicApiKeyPrefix, hashPublicApiKey } from "../lib/public-api-keys.js";
import { getPublicApiMetrics } from "../services/public-api-metrics.js";

const router = Router();

function formatApiKey(item) {
  return {
    id: item.id,
    name: item.name,
    key_prefix: item.keyPrefix,
    last_used_at: item.lastUsedAt?.toISOString?.()?.replace(/\.\d{3}Z$/, "Z") ?? null,
    expires_at: item.expiresAt?.toISOString?.()?.replace(/\.\d{3}Z$/, "Z") ?? null,
    revoked_at: item.revokedAt?.toISOString?.()?.replace(/\.\d{3}Z$/, "Z") ?? null,
    created_at: item.createdAt?.toISOString?.()?.replace(/\.\d{3}Z$/, "Z") ?? null,
  };
}

router.get("/", requireAuth, requireOrg, requireOrgRole("owner", "admin"), async (req, res) => {
  try {
    const items = await prisma.publicApiKey.findMany({
      where: {
        organizationId: req.organizationId,
      },
      orderBy: { createdAt: "desc" },
    });
    return res.json({ items: items.map(formatApiKey) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ detail: err.message });
  }
});

router.get("/metrics", requireAuth, requireOrg, requireOrgRole("owner", "admin"), async (req, res) => {
  try {
    const days = parseInt(req.query.days, 10) || 7;
    const metrics = await getPublicApiMetrics({
      organizationId: req.organizationId,
      days,
    });
    return res.json(metrics);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ detail: err.message });
  }
});

router.post("/", requireAuth, requireOrg, requireOrgRole("owner", "admin"), async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const expiresAtRaw = req.body.expires_at;
    if (!name) {
      return res.status(400).json({ detail: "name is required" });
    }
    if (name.length > 100) {
      return res.status(400).json({ detail: "name must be at most 100 characters" });
    }

    let expiresAt = null;
    if (expiresAtRaw) {
      const parsed = new Date(expiresAtRaw);
      if (isNaN(parsed.getTime())) {
        return res.status(400).json({ detail: "expires_at must be a valid ISO datetime" });
      }
      if (parsed <= new Date()) {
        return res.status(400).json({ detail: "expires_at must be in the future" });
      }
      expiresAt = parsed;
    }

    const rawKey = generateRawPublicApiKey();
    const created = await prisma.publicApiKey.create({
      data: {
        organizationId: req.organizationId,
        userId: req.user.id,
        name,
        keyPrefix: getPublicApiKeyPrefix(rawKey),
        keyHash: hashPublicApiKey(rawKey),
        expiresAt,
      },
    });

    return res.status(201).json({
      ...formatApiKey(created),
      api_key: rawKey,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ detail: err.message });
  }
});

router.post("/:id/revoke", requireAuth, requireOrg, requireOrgRole("owner", "admin"), async (req, res) => {
  try {
    const id = req.params.id;
    const existing = await prisma.publicApiKey.findFirst({
      where: {
        id,
        organizationId: req.organizationId,
      },
    });
    if (!existing) {
      return res.status(404).json({ detail: "API key not found" });
    }

    const updated = await prisma.publicApiKey.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
    return res.json(formatApiKey(updated));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ detail: err.message });
  }
});

router.get("/:id/metrics", requireAuth, requireOrg, requireOrgRole("owner", "admin"), async (req, res) => {
  try {
    const id = req.params.id;
    const days = parseInt(req.query.days, 10) || 7;
    const existing = await prisma.publicApiKey.findFirst({
      where: {
        id,
        organizationId: req.organizationId,
      },
      select: { id: true },
    });
    if (!existing) {
      return res.status(404).json({ detail: "API key not found" });
    }
    const metrics = await getPublicApiMetrics({
      organizationId: req.organizationId,
      keyId: id,
      days,
    });
    return res.json(metrics);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ detail: err.message });
  }
});

export default router;
