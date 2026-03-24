import { Router } from "express";
import prisma from "../lib/prisma.js";
import { requirePublicApiKey } from "../middleware/public-api-auth.js";
import { E164_REGEX, STATUSES, toUtc, formatReminder } from "../lib/utils.js";
import { assertOrResolveVapiLine, userHasOutboundLine } from "../lib/vapi-integration.js";
import { publicApiError } from "../lib/public-api-response.js";

const router = Router();

function parseCustomRecurrenceConfig(rawConfig) {
  let parsed;
  try {
    parsed = typeof rawConfig === "string" ? JSON.parse(rawConfig) : rawConfig;
  } catch {
    return { ok: false, detail: "Invalid custom recurrence config JSON." };
  }
  if (!parsed || typeof parsed !== "object") {
    return { ok: false, detail: "Custom recurrence config must be an object." };
  }

  const intervalDays = Number(parsed.interval_days);
  if (Number.isFinite(intervalDays) && intervalDays >= 1) {
    return {
      ok: true,
      config: { interval_days: Math.min(365, Math.floor(intervalDays)) },
    };
  }

  if (Array.isArray(parsed.weekdays)) {
    const weekdays = [...new Set(parsed.weekdays.map((n) => Number(n)).filter((n) => Number.isInteger(n) && n >= 0 && n <= 6))].sort(
      (a, b) => a - b
    );
    if (!weekdays.length) {
      return { ok: false, detail: "Custom weekdays recurrence requires at least one weekday." };
    }
    return { ok: true, config: { weekdays } };
  }

  return { ok: false, detail: "Custom recurrence must provide interval_days or weekdays." };
}

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

router.use(requirePublicApiKey);

router.get("/me", async (req, res) => {
  return res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
    },
    organization_id: req.organizationId,
    api_key_id: req.publicApiKey.id,
  });
});

router.get("/reminders", async (req, res) => {
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
        include: {
          vapiLine: { include: { config: { select: { name: true } } } },
        },
      }),
      prisma.reminder.count({ where }),
    ]);

    return res.json({
      items: items.map(formatReminder),
      total,
      page,
      page_size: pageSize,
      total_pages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    console.error(err);
    return publicApiError(res, 500, "internal_error", "Unexpected server error.");
  }
});

router.post("/reminders", async (req, res) => {
  try {
    const { title, message, phone_number, scheduled_at, timezone, recurrence_type, recurrence_config } = req.body;
    const recurrence_end_at = req.body.recurrence_end_at;
    if (!title?.trim() || !message?.trim() || !phone_number || !scheduled_at || !timezone) {
      return publicApiError(res, 400, "validation_error", "Missing required fields.");
    }
    if (!E164_REGEX.test(phone_number)) {
      return publicApiError(res, 400, "validation_error", "Phone number must be in E.164 format.");
    }

    const scheduledUtc = toUtc(scheduled_at, timezone);
    if (scheduledUtc <= new Date()) {
      return publicApiError(res, 400, "validation_error", "Scheduled time must be in the future.");
    }

    const hasOutbound = await userHasOutboundLine(req.user.id);
    if (!hasOutbound) {
      return publicApiError(
        res,
        400,
        "missing_outbound_line",
        "Add a Vapi integration with at least one phone number before creating reminders."
      );
    }

    const lineResult = await assertOrResolveVapiLine(req.user.id, req.body.vapi_line_id);
    if (!lineResult.ok) {
      return publicApiError(res, 400, "validation_error", lineResult.detail);
    }

    const data = {
      userId: req.user.id,
      title: title.trim(),
      message: message.trim(),
      phone_number,
      scheduled_at: scheduledUtc,
      timezone,
      status: "scheduled",
      vapiLineId: lineResult.vapiLineId,
    };

    if (recurrence_type !== undefined) {
      data.recurrence_type = ["daily", "weekly", "custom"].includes(recurrence_type) ? recurrence_type : null;
      if (data.recurrence_type !== "custom") {
        data.recurrence_config = null;
      }
    }
    if (recurrence_config !== undefined && data.recurrence_type === "custom") {
      const parsed = parseCustomRecurrenceConfig(recurrence_config);
      if (!parsed.ok) return publicApiError(res, 400, "validation_error", parsed.detail);
      data.recurrence_config = JSON.stringify(parsed.config);
    }
    if (data.recurrence_type === "custom" && !data.recurrence_config) {
      return publicApiError(res, 400, "validation_error", "Custom recurrence requires recurrence_config.");
    }
    if (recurrence_end_at !== undefined && data.recurrence_type) {
      data.recurrence_end_at = recurrence_end_at ? toUtc(recurrence_end_at, timezone) : null;
      if (data.recurrence_end_at && data.recurrence_end_at <= scheduledUtc) {
        return publicApiError(res, 400, "validation_error", "Recurrence end date must be after the first scheduled run.");
      }
    }

    const reminder = await prisma.reminder.create({
      data,
      include: {
        vapiLine: { include: { config: { select: { name: true } } } },
      },
    });
    return res.status(201).json(formatReminder(reminder));
  } catch (err) {
    console.error(err);
    return publicApiError(res, 500, "internal_error", "Unexpected server error.");
  }
});

router.get("/reminders/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return publicApiError(res, 400, "validation_error", "Invalid reminder id.");
    const reminder = await prisma.reminder.findFirst({
      where: { id, userId: req.user.id },
      include: {
        vapiLine: { include: { config: { select: { name: true } } } },
      },
    });
    if (!reminder) return publicApiError(res, 404, "not_found", "Reminder not found.");
    return res.json(formatReminder(reminder));
  } catch (err) {
    console.error(err);
    return publicApiError(res, 500, "internal_error", "Unexpected server error.");
  }
});

router.patch("/reminders/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return publicApiError(res, 400, "validation_error", "Invalid reminder id.");
    const reminder = await prisma.reminder.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!reminder) return publicApiError(res, 404, "not_found", "Reminder not found.");

    const canUpdate = ["scheduled", "paused", "failed"].includes(reminder.status);
    if (!canUpdate) {
      return publicApiError(res, 400, "invalid_state", "Can only update scheduled, paused, or failed reminders.");
    }

    const { title, message, phone_number, scheduled_at, timezone, recurrence_type, recurrence_config, status } = req.body;
    const recurrence_end_at = req.body.recurrence_end_at;
    const data = {};
    if (title !== undefined) data.title = title.trim();
    if (message !== undefined) data.message = message.trim();
    if (phone_number !== undefined) {
      if (!E164_REGEX.test(phone_number)) {
        return publicApiError(res, 400, "validation_error", "Phone number must be in E.164 format.");
      }
      data.phone_number = phone_number;
    }
    if (timezone !== undefined) data.timezone = timezone;
    if (scheduled_at !== undefined) {
      const tz = timezone ?? reminder.timezone;
      const scheduledUtc = toUtc(scheduled_at, tz);
      if (scheduledUtc <= new Date()) {
        return publicApiError(res, 400, "validation_error", "Scheduled time must be in the future.");
      }
      data.scheduled_at = scheduledUtc;
      if (reminder.status === "failed") {
        data.status = "scheduled";
        data.error_message = null;
      }
    }
    if (recurrence_type !== undefined) {
      data.recurrence_type = ["daily", "weekly", "custom"].includes(recurrence_type) ? recurrence_type : null;
      if (data.recurrence_type !== "custom") {
        data.recurrence_config = null;
      }
    }
    if (recurrence_config !== undefined && (data.recurrence_type === "custom" || reminder.recurrence_type === "custom")) {
      const parsed = parseCustomRecurrenceConfig(recurrence_config);
      if (!parsed.ok) return publicApiError(res, 400, "validation_error", parsed.detail);
      data.recurrence_config = JSON.stringify(parsed.config);
    }
    if ((data.recurrence_type === "custom" || (data.recurrence_type === undefined && reminder.recurrence_type === "custom")) &&
      recurrence_config === undefined &&
      !reminder.recurrence_config
    ) {
      return publicApiError(res, 400, "validation_error", "Custom recurrence requires recurrence_config.");
    }
    if (recurrence_end_at !== undefined && (data.recurrence_type || reminder.recurrence_type)) {
      const tz = timezone ?? reminder.timezone;
      data.recurrence_end_at = recurrence_end_at ? toUtc(recurrence_end_at, tz) : null;
      const effectiveScheduledAt = data.scheduled_at ?? reminder.scheduled_at;
      if (data.recurrence_end_at && data.recurrence_end_at <= effectiveScheduledAt) {
        return publicApiError(res, 400, "validation_error", "Recurrence end date must be after the next scheduled run.");
      }
    }
    if (status === "paused" && reminder.status === "scheduled" && reminder.recurrence_type) {
      data.status = "paused";
    }
    if (status === "scheduled" && reminder.status === "paused") {
      data.status = "scheduled";
    }

    if (req.body.vapi_line_id !== undefined) {
      const lineResult = await assertOrResolveVapiLine(req.user.id, req.body.vapi_line_id);
      if (!lineResult.ok) return publicApiError(res, 400, "validation_error", lineResult.detail);
      data.vapiLineId = lineResult.vapiLineId;
    }

    const updated = await prisma.reminder.update({
      where: { id },
      data,
      include: {
        vapiLine: { include: { config: { select: { name: true } } } },
      },
    });
    return res.json(formatReminder(updated));
  } catch (err) {
    console.error(err);
    return publicApiError(res, 500, "internal_error", "Unexpected server error.");
  }
});

router.delete("/reminders/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return publicApiError(res, 400, "validation_error", "Invalid reminder id.");
    const reminder = await prisma.reminder.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!reminder) return publicApiError(res, 404, "not_found", "Reminder not found.");
    await prisma.reminder.delete({ where: { id } });
    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return publicApiError(res, 500, "internal_error", "Unexpected server error.");
  }
});

router.get("/executions", async (req, res) => {
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

    return res.json({
      items: items.map(formatExecution),
      total,
      page,
      page_size: pageSize,
      total_pages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    console.error(err);
    return publicApiError(res, 500, "internal_error", "Unexpected server error.");
  }
});

export default router;
