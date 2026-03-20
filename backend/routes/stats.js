import { Router } from "express";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { getSchedulerStatus } from "../services/scheduler.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const where = { userId: req.user.id };
    const [total, scheduled, paused, completed, failed, in_progress] = await Promise.all([
      prisma.reminder.count({ where }),
      prisma.reminder.count({ where: { ...where, status: "scheduled" } }),
      prisma.reminder.count({ where: { ...where, status: "paused" } }),
      prisma.reminder.count({ where: { ...where, status: "completed" } }),
      prisma.reminder.count({ where: { ...where, status: "failed" } }),
      prisma.reminder.count({ where: { ...where, status: "in_progress" } }),
    ]);
    res.json({ total, scheduled, paused, completed, failed, in_progress });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: err.message });
  }
});

router.get("/ops", requireAuth, async (req, res) => {
  try {
    res.json({
      scheduler: getSchedulerStatus(),
      now: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: err.message });
  }
});

export default router;
