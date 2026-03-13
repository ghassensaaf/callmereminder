import "dotenv/config";
import express from "express";
import cors from "cors";
import { fromZonedTime } from "date-fns-tz";
import prisma from "./lib/prisma.js";
import { startScheduler, stopScheduler } from "./services/scheduler.js";

const app = express();
const PORT = process.env.PORT || 8000;

const corsOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json());

const E164_REGEX = /^\+[1-9]\d{1,14}$/;
const STATUSES = ["scheduled", "completed", "failed", "in_progress"];

function toUtc(naiveDateStr, tzName) {
  try {
    const str = typeof naiveDateStr === "string" ? naiveDateStr.replace("Z", "").slice(0, 19) : naiveDateStr;
    return fromZonedTime(str, tzName);
  } catch (err) {
    console.error("Timezone conversion error:", err);
    return new Date(naiveDateStr);
  }
}

function formatReminder(r) {
  return {
    id: r.id,
    title: r.title,
    message: r.message,
    phone_number: r.phone_number,
    scheduled_at: r.scheduled_at?.toISOString?.()?.replace(/\.\d{3}Z$/, "Z") ?? r.scheduled_at,
    timezone: r.timezone,
    status: r.status,
    call_id: r.call_id ?? null,
    error_message: r.error_message ?? null,
    created_at: r.created_at?.toISOString?.()?.replace(/\.\d{3}Z$/, "Z") ?? r.created_at,
    updated_at: r.updated_at?.toISOString?.()?.replace(/\.\d{3}Z$/, "Z") ?? r.updated_at ?? null,
  };
}

app.get("/", (_, res) => {
  res.json({ message: "CallMe Reminder API", version: "1.0.0" });
});

app.get("/health", (_, res) => {
  res.json({ status: "healthy" });
});

app.post("/api/reminders", async (req, res) => {
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

app.get("/api/reminders", async (req, res) => {
  try {
    const status = req.query.status;
    const search = req.query.search;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.page_size, 10) || 20));

    const where = {};
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

app.get("/api/reminders/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ detail: "Invalid ID" });
    const reminder = await prisma.reminder.findUnique({ where: { id } });
    if (!reminder) return res.status(404).json({ detail: "Reminder not found" });
    res.json(formatReminder(reminder));
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: err.message });
  }
});

app.put("/api/reminders/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ detail: "Invalid ID" });
    const reminder = await prisma.reminder.findUnique({ where: { id } });
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

app.delete("/api/reminders/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ detail: "Invalid ID" });
    const reminder = await prisma.reminder.findUnique({ where: { id } });
    if (!reminder) return res.status(404).json({ detail: "Reminder not found" });
    await prisma.reminder.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: err.message });
  }
});

app.get("/api/stats", async (req, res) => {
  try {
    const [total, scheduled, completed, failed, in_progress] = await Promise.all([
      prisma.reminder.count(),
      prisma.reminder.count({ where: { status: "scheduled" } }),
      prisma.reminder.count({ where: { status: "completed" } }),
      prisma.reminder.count({ where: { status: "failed" } }),
      prisma.reminder.count({ where: { status: "in_progress" } }),
    ]);
    res.json({ total, scheduled, completed, failed, in_progress });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: err.message });
  }
});

async function main() {
  try {
    await prisma.$connect();
    console.log("Database connected");
  } catch (err) {
    console.error("Database connection failed:", err);
    process.exit(1);
  }

  startScheduler();

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });

  const shutdown = () => {
    stopScheduler();
    server.close(() => {
      prisma.$disconnect();
      process.exit(0);
    });
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
