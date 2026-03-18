import { Router } from "express";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { E164_REGEX, STATUSES, toUtc, formatReminder } from "../lib/utils.js";

const router = Router();

function formatExecution(e) {
  return {
    id: e.id,
    reminder_id: e.reminderId,
    reminder_title: e.reminder?.title ?? null,
    reminder_message: e.reminder?.message ?? null,
    scheduled_at: e.scheduled_at?.toISOString?.()?.replace(/\.\d{3}Z$/, "Z") ?? e.scheduled_at,
    status: e.status,
    call_id: e.call_id ?? null,
    error_message: e.error_message ?? null,
    executed_at: e.executed_at?.toISOString?.()?.replace(/\.\d{3}Z$/, "Z") ?? e.executed_at,
  };
}

router.post("/", requireAuth, async (req, res) => {
  try {
    const { title, message, phone_number, scheduled_at, timezone, recurrence_type, recurrence_config, recurrence_end_at } = req.body;
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

    const data = {
      userId: req.user.id,
      title: title.trim(),
      message: message.trim(),
      phone_number,
      scheduled_at: scheduledUtc,
      timezone,
      status: "scheduled",
    };
    if (recurrence_type !== undefined) {
      data.recurrence_type = ["daily", "weekly", "custom"].includes(recurrence_type) ? recurrence_type : null;
    }
    if (recurrence_config !== undefined && data.recurrence_type === "custom") {
      data.recurrence_config =
        typeof recurrence_config === "string" ? recurrence_config : JSON.stringify(recurrence_config);
    }
    if (recurrence_end_at !== undefined && data.recurrence_type) {
      data.recurrence_end_at = recurrence_end_at ? toUtc(recurrence_end_at, timezone) : null;
    }

    const reminder = await prisma.reminder.create({ data });
    res.status(201).json(formatReminder(reminder));
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: err.message });
  }
});

router.get("/executions", requireAuth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.page_size, 10) || 20));
    const dateFrom = req.query.date_from;
    const dateTo = req.query.date_to;

    const where = { userId: req.user.id };
    const execFilter = {};
    if (dateFrom) {
      const d = new Date(dateFrom);
      if (!isNaN(d.getTime())) execFilter.gte = d;
    }
    if (dateTo) {
      const d = new Date(dateTo);
      if (!isNaN(d.getTime())) {
        d.setHours(23, 59, 59, 999);
        execFilter.lte = d;
      }
    }
    if (Object.keys(execFilter).length) where.executed_at = execFilter;

    const [items, total] = await Promise.all([
      prisma.reminderExecution.findMany({
        where,
        orderBy: { executed_at: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { reminder: { select: { title: true, message: true } } },
      }),
      prisma.reminderExecution.count({ where }),
    ]);

    res.json({
      items: items.map(formatExecution),
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

router.get("/", requireAuth, async (req, res) => {
  try {
    const status = req.query.status;
    const search = req.query.search;
    const dateFrom = req.query.date_from;
    const dateTo = req.query.date_to;
    const sort = req.query.sort || "scheduled_at_asc";
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
    const dateFilter = {};
    if (dateFrom) {
      const d = new Date(dateFrom);
      if (!isNaN(d.getTime())) dateFilter.gte = d;
    }
    if (dateTo) {
      const d = new Date(dateTo);
      if (!isNaN(d.getTime())) {
        d.setHours(23, 59, 59, 999);
        dateFilter.lte = d;
      }
    }
    if (Object.keys(dateFilter).length) where.updated_at = dateFilter;

    const orderBy =
      sort === "updated_at_desc"
        ? { updated_at: "desc" }
        : sort === "scheduled_at_desc"
          ? { scheduled_at: "desc" }
          : { scheduled_at: "asc" };

    const [items, total] = await Promise.all([
      prisma.reminder.findMany({
        where,
        orderBy,
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
    const canUpdate = ["scheduled", "paused", "failed"].includes(reminder.status);
    if (!canUpdate) {
      return res.status(400).json({ detail: "Can only update scheduled, paused, or failed reminders" });
    }

    const { title, message, phone_number, scheduled_at, timezone, recurrence_type, recurrence_config, recurrence_end_at, status } = req.body;
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
      if (reminder.status === "failed") {
        data.status = "scheduled";
        data.error_message = null;
      }
    }
    if (recurrence_type !== undefined) {
      data.recurrence_type = ["daily", "weekly", "custom"].includes(recurrence_type) ? recurrence_type : null;
    }
    if (recurrence_config !== undefined && (data.recurrence_type === "custom" || reminder.recurrence_type === "custom")) {
      data.recurrence_config =
        typeof recurrence_config === "string" ? recurrence_config : JSON.stringify(recurrence_config);
    }
    if (recurrence_end_at !== undefined && (data.recurrence_type || reminder.recurrence_type)) {
      const tz = timezone ?? reminder.timezone;
      data.recurrence_end_at = recurrence_end_at ? toUtc(recurrence_end_at, tz) : null;
    }
    if (status === "paused" && reminder.status === "scheduled" && reminder.recurrence_type) {
      data.status = "paused";
    }
    if (status === "scheduled" && reminder.status === "paused") {
      data.status = "scheduled";
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

router.post("/bulk-delete", requireAuth, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ detail: "ids array required" });
    }
    const validIds = ids.filter((id) => typeof id === "number" || (typeof id === "string" && !isNaN(parseInt(id, 10)))).map((id) => parseInt(String(id), 10));
    const result = await prisma.reminder.deleteMany({
      where: {
        id: { in: validIds },
        userId: req.user.id,
        status: { in: ["completed", "failed"] },
      },
    });
    res.json({ deleted: result.count });
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
