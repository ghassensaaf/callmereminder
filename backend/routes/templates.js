import { Router } from "express";
import prisma from "../lib/prisma.js";
import { requireAuth, requireOrg, requireOrgRole } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, requireOrg, async (req, res) => {
  try {
    const items = await prisma.reminderTemplate.findMany({
      where: { organizationId: req.organizationId },
      orderBy: { created_at: "desc" },
    });
    res.json(
      items.map((t) => ({
        id: t.id,
        title: t.title,
        message: t.message,
        created_at: t.created_at?.toISOString?.()?.replace(/\.\d{3}Z$/, "Z") ?? t.created_at,
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: err.message });
  }
});

router.post("/", requireAuth, requireOrg, requireOrgRole("owner", "admin"), async (req, res) => {
  try {
    const { title, message } = req.body;
    if (!title?.trim() || !message?.trim()) {
      return res.status(400).json({ detail: "Title and message required" });
    }
    const template = await prisma.reminderTemplate.create({
      data: {
        organizationId: req.organizationId,
        title: title.trim(),
        message: message.trim(),
      },
    });
    res.status(201).json({
      id: template.id,
      title: template.title,
      message: template.message,
      created_at: template.created_at?.toISOString?.()?.replace(/\.\d{3}Z$/, "Z"),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: err.message });
  }
});

router.delete("/:id", requireAuth, requireOrg, requireOrgRole("owner", "admin"), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ detail: "Invalid ID" });
    const template = await prisma.reminderTemplate.findFirst({
      where: { id, organizationId: req.organizationId },
    });
    if (!template) return res.status(404).json({ detail: "Template not found" });
    await prisma.reminderTemplate.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: err.message });
  }
});

export default router;
