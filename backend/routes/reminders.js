import { Router } from "express";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { E164_REGEX, STATUSES, toUtc, formatReminder } from "../lib/utils.js";

const router = Router();

router.post("/", requireAuth, async (req, res) => {
  try {
    const { title, message, phone_number, scheduled_at, timezone } = req.body;
    if (!title?.trim() || !message?.trim() || !phone_number || !scheduled_at || !timezone) {
      return res.status(400).json({ detail: "Missing required fields" });
    }
    if (!E164_REGEX.test(phone_number)) {
      return res.status(400).json({ detail: "Phone number must be in E.164 format (e.g., +14155552671)" });
    }

    const scheduledUtc = toUtc(scheduled_at, timezone);
    const now = new Date();
    if (scheduledUtc <= now) {
      return res.status(400).json({ detail: "Scheduled time must be in the future" });
    }

    const reminder = await prisma.reminder.create({
      data: {
        userId: req.user.id,
        title: title.trim(),
        message: message.trim(),
        phone_number,
        scheduled_at: scheduledUtc,
        timezone,
        status: "scheduled",
      },
    });
    res.status(201).json(formatReminder(reminder));
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: err.message });
  }
});

router.get("/", requireAuth, async (req, res) => {
  try {
    const status = req.query.status;
    const search = req.query.search;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.page_size, 10) || 20));

    const where = { userId: req.user.id };
    if (status && STATUSES.includes(status)) where.status = status;
    if (search?.trim()) {
      where.OR = [
        { title: { contains: search.trim(), mode: "insensitive" } },
        { message: { contains: search.trim(), mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.reminder.findMany({
        where,
        orderBy: { scheduled_at: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.reminder.count({ where }),
    ]);

    res.json({
      items: items.map(formatReminder),
      total,
      page,
      page_size: pageSize,
      total_pages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: err.message });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ detail: "Invalid ID" });
    const reminder = await prisma.reminder.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!reminder) return res.status(404).json({ detail: "Reminder not found" });
    res.json(formatReminder(reminder));
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: err.message });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ detail: "Invalid ID" });
    const reminder = await prisma.reminder.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!reminder) return res.status(404).json({ detail: "Reminder not found" });
    if (reminder.status !== "scheduled") {
      return res.status(400).json({ detail: "Can only update scheduled reminders" });
    }

    const { title, message, phone_number, scheduled_at, timezone } = req.body;
    const data = {};
    if (title !== undefined) data.title = title.trim();
    if (message !== undefined) data.message = message.trim();
    if (phone_number !== undefined) {
      if (!E164_REGEX.test(phone_number)) {
        return res.status(400).json({ detail: "Phone number must be in E.164 format" });
      }
      data.phone_number = phone_number;
    }
    if (timezone !== undefined) data.timezone = timezone;
    if (scheduled_at !== undefined) {
      const tz = timezone ?? reminder.timezone;
      const scheduledUtc = toUtc(scheduled_at, tz);
      if (scheduledUtc <= new Date()) {
        return res.status(400).json({ detail: "Scheduled time must be in the future" });
      }
      data.scheduled_at = scheduledUtc;
    }

    const updated = await prisma.reminder.update({
      where: { id },
      data,
    });
    res.json(formatReminder(updated));
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: err.message });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ detail: "Invalid ID" });
    const reminder = await prisma.reminder.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!reminder) return res.status(404).json({ detail: "Reminder not found" });
    await prisma.reminder.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: err.message });
  }
});

export default router;
