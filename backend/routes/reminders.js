import { Router } from "express";
import { addMinutes, addHours, addDays, setHours, setMinutes, startOfDay } from "date-fns";
import { toZonedTime, formatInTimeZone } from "date-fns-tz";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { E164_REGEX, STATUSES, toUtc, formatReminder } from "../lib/utils.js";
import { verifyVoiceActionToken } from "../lib/voice-action-token.js";
import { fetchCallLog } from "../services/vapi.js";

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
    call_details: e.call_details ?? null,
    executed_at: e.executed_at?.toISOString?.()?.replace(/\.\d{3}Z$/, "Z") ?? e.executed_at,
  };
}

router.post("/", requireAuth, async (req, res) => {
  try {
    const { title, message, phone_number, scheduled_at, timezone, recurrence_type, recurrence_config } = req.body;
    const recurrence_end_at = req.body.recurrence_end_at;
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

/**
 * Voice action endpoint - called by Vapi when user speaks during a reminder call.
 * No auth - uses signed token. Actions: snooze, dismiss.
 */
router.post("/voice-action", async (req, res) => {
  try {
    const { token, action, duration } = req.body;
    const decoded = verifyVoiceActionToken(token);
    if (!decoded) {
      return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }

    const reminder = await prisma.reminder.findFirst({
      where: { id: decoded.reminderId },
    });
    if (!reminder) {
      return res.status(404).json({ success: false, message: "Reminder not found" });
    }
    // Allow in_progress (during call) and completed (scheduler may have marked it before user spoke)
    if (!["scheduled", "in_progress", "completed"].includes(reminder.status)) {
      return res.status(400).json({ success: false, message: "Reminder cannot be modified" });
    }

    const tz = reminder.timezone || "UTC";
    const now = new Date();
    const zonedNow = toZonedTime(now, tz);

    if (action === "snooze") {
      const dur = (duration || "10min").toLowerCase();
      let scheduledUtc;
      if (dur === "10min" || dur === "10 minutes") {
        scheduledUtc = addMinutes(now, 10);
      } else if (dur === "1hour" || dur === "1 hour" || dur === "one hour") {
        scheduledUtc = addHours(now, 1);
      } else if (dur === "tomorrow") {
        const tomorrow9 = setMinutes(setHours(addDays(startOfDay(zonedNow), 1), 9), 0);
        const dateStr = formatInTimeZone(tomorrow9, tz, "yyyy-MM-dd'T'HH:mm:ss");
        scheduledUtc = toUtc(dateStr, tz);
      } else {
        scheduledUtc = addMinutes(now, 10); // default
      }

      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { scheduled_at: scheduledUtc, status: "scheduled", error_message: null },
      });

      const friendly =
        dur.includes("10") ? "10 minutes" : dur.includes("hour") ? "1 hour" : dur.includes("tomorrow") ? "tomorrow 9:00" : "10 minutes";
      return res.json({ success: true, message: `Snoozed until ${friendly}` });
    }

    if (action === "dismiss") {
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { status: "completed", error_message: null },
      });
      return res.json({ success: true, message: "Reminder dismissed" });
    }

    return res.status(400).json({ success: false, message: "Unknown action. Use snooze or dismiss." });
  } catch (err) {
    console.error("Voice action error:", err);
    res.status(500).json({ success: false, message: err.message });
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

/** Pull transcript / recording metadata from Vapi for an execution (manual refresh). */
router.post("/executions/:execId/sync-call-log", requireAuth, async (req, res) => {
  try {
    const execId = parseInt(req.params.execId, 10);
    if (isNaN(execId)) return res.status(400).json({ detail: "Invalid execution id" });

    const execution = await prisma.reminderExecution.findFirst({
      where: { id: execId, userId: req.user.id },
    });
    if (!execution) return res.status(404).json({ detail: "Execution not found" });
    if (!execution.call_id?.trim()) {
      return res.status(400).json({ detail: "This run has no Vapi call id (e.g. failed before dial)." });
    }

    const settings = await prisma.userSettings.findUnique({ where: { userId: req.user.id } });
    if (!settings?.vapiApiKey?.trim()) {
      return res.status(400).json({ detail: "Add your Vapi API key in Settings to load call details." });
    }

    const details = await fetchCallLog(settings.vapiApiKey, execution.call_id);
    if (!details) {
      return res.status(502).json({ detail: "Could not load this call from Vapi. It may still be in progress or expired." });
    }

    const updated = await prisma.reminderExecution.update({
      where: { id: execId },
      data: { call_details: details },
      include: { reminder: { select: { title: true, message: true } } },
    });

    res.json(formatExecution(updated));
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

    const { title, message, phone_number, scheduled_at, timezone, recurrence_type, recurrence_config, status } = req.body;
    const recurrence_end_at = req.body.recurrence_end_at;
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
