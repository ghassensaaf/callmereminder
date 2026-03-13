import prisma from "../lib/prisma.js";
import { makeCall } from "./vapi.js";

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
      include: { user: { include: { settings: true } } },
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

      const settings = reminder.user?.settings;
      const apiKey = settings?.vapiApiKey ?? null;
      const phoneNumberId = settings?.vapiPhoneNumberId ?? null;

      const { success, callId, errorMessage } = await makeCall(
        reminder.phone_number,
        reminder.message,
        reminder.title,
        apiKey,
        phoneNumberId
      );

      if (success) {
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: { status: "completed", call_id: callId, error_message: null },
        });
        console.log(`Reminder ${reminder.id} completed. Call ID: ${callId}`);
      } else {
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: { status: "failed", error_message: errorMessage },
        });
        console.error(`Reminder ${reminder.id} failed: ${errorMessage}`);
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
