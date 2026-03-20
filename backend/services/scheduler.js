import prisma from "../lib/prisma.js";
import { computeNextScheduledAt } from "../lib/utils.js";
import { generateVoiceActionToken } from "../lib/voice-action-token.js";
import { makeCall } from "./vapi.js";
import { resolveLineForDial } from "../lib/vapi-integration.js";

let intervalId = null;

async function processDueReminders() {
  try {
    const now = new Date();

    const dueReminders = await prisma.reminder.findMany({
      where: {
        status: "scheduled",
        scheduled_at: { lte: now },
      },
      orderBy: { scheduled_at: "asc" },
      include: { user: true },
    });

    if (dueReminders.length > 0) {
      console.log(`Found ${dueReminders.length} due reminders to process`);
    }

    for (const reminder of dueReminders) {
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { status: "in_progress" },
      });

      console.log(`Processing reminder ${reminder.id}: ${reminder.title}`);

      const resolved = await resolveLineForDial(reminder.userId, reminder.vapiLineId);
      const apiKey = resolved?.apiKey ?? null;
      const phoneNumberId = resolved?.vapiPhoneNumberId ?? null;

      const voiceActionToken = generateVoiceActionToken(reminder.id);
      const { success, callId, errorMessage } = await makeCall(
        reminder.phone_number,
        reminder.message,
        reminder.title,
        apiKey,
        phoneNumberId,
        { reminderId: reminder.id, voiceActionToken }
      );

      const execStatus = success ? "completed" : "failed";
      await prisma.reminderExecution.create({
        data: {
          reminderId: reminder.id,
          userId: reminder.userId,
          scheduled_at: reminder.scheduled_at,
          status: execStatus,
          call_id: success ? callId : null,
          error_message: success ? null : errorMessage,
        },
      });

      const isRecurring = ["daily", "weekly", "custom"].includes(reminder.recurrence_type || "");
      const maxRetries = 2;
      const shouldRetry = !success && (reminder.retry_count ?? 0) < maxRetries;

      if (shouldRetry) {
        const { addMinutes } = await import("date-fns");
        const retryAt = addMinutes(reminder.scheduled_at, 5);
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: {
            status: "scheduled",
            scheduled_at: retryAt,
            retry_count: (reminder.retry_count ?? 0) + 1,
            call_id: null,
            error_message: null,
          },
        });
        console.log(`Reminder ${reminder.id} failed, retry ${(reminder.retry_count ?? 0) + 1}/${maxRetries} at ${retryAt.toISOString()}`);
      } else if (isRecurring) {
        const nextScheduled = computeNextScheduledAt(
          reminder.scheduled_at,
          reminder.timezone,
          reminder.recurrence_type,
          reminder.recurrence_config
        );
        const pastEnd = reminder.recurrence_end_at && new Date(nextScheduled) > new Date(reminder.recurrence_end_at);
        if (pastEnd) {
          await prisma.reminder.update({
            where: { id: reminder.id },
            data: { status: "completed", call_id: success ? callId : null, error_message: success ? null : errorMessage },
          });
          console.log(`Reminder ${reminder.id} completed (recurrence ended)`);
        } else {
          await prisma.reminder.update({
            where: { id: reminder.id },
            data: {
              status: "scheduled",
              scheduled_at: nextScheduled,
              call_id: null,
              error_message: null,
              retry_count: 0,
            },
          });
          console.log(`Reminder ${reminder.id} ${execStatus}. Next run: ${nextScheduled.toISOString()}`);
        }
      } else {
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: {
            status: execStatus,
            call_id: success ? callId : null,
            error_message: success ? null : errorMessage,
            retry_count: 0,
          },
        });
        console.log(`Reminder ${reminder.id} ${execStatus}. Call ID: ${callId ?? "N/A"}`);
      }
    }
  } catch (err) {
    console.error("Error processing reminders:", err);
  }
}

export function startScheduler() {
  intervalId = setInterval(processDueReminders, 15000);
  console.log("Scheduler started - checking for due reminders every 15 seconds");
}

export function stopScheduler() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("Scheduler stopped");
  }
}
