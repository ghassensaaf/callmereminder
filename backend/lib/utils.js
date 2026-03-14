import { addDays, addWeeks } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

export const E164_REGEX = /^\+[1-9]\d{1,14}$/;
export const STATUSES = ["scheduled", "paused", "completed", "failed", "in_progress"];

export function toUtc(naiveDateStr, tzName) {
  try {
    const str = typeof naiveDateStr === "string" ? naiveDateStr.replace("Z", "").slice(0, 19) : naiveDateStr;
    return fromZonedTime(str, tzName);
  } catch (err) {
    console.error("Timezone conversion error:", err);
    return new Date(naiveDateStr);
  }
}

/**
 * Compute next scheduled_at for recurring reminders.
 * @param {Date} currentScheduled - Current scheduled_at (UTC)
 * @param {string} timezone - User timezone (e.g. "America/New_York")
 * @param {string} recurrenceType - "daily" | "weekly" | "custom"
 * @param {string|null} recurrenceConfig - JSON e.g. {"weekdays":[1,3,5]} for custom
 * @returns {Date} Next scheduled_at in UTC
 */
export function computeNextScheduledAt(currentScheduled, timezone, recurrenceType, recurrenceConfig) {
  const tz = timezone || "UTC";
  const zoned = toZonedTime(currentScheduled, tz);

  let nextZoned;
  if (recurrenceType === "daily") {
    nextZoned = addDays(zoned, 1);
  } else if (recurrenceType === "weekly") {
    nextZoned = addWeeks(zoned, 1);
  } else if (recurrenceType === "custom" && recurrenceConfig) {
    let config;
    try {
      config = typeof recurrenceConfig === "string" ? JSON.parse(recurrenceConfig) : recurrenceConfig;
    } catch {
      return addDays(zoned, 1);
    }
    // Every N days: {"interval_days": 3}
    const intervalDays = config.interval_days;
    if (typeof intervalDays === "number" && intervalDays >= 1) {
      nextZoned = addDays(zoned, intervalDays);
    } else {
      // Specific weekdays: {"weekdays":[1,3,5]}
      const weekdays = config.weekdays;
      if (!Array.isArray(weekdays) || weekdays.length === 0) {
        return addDays(zoned, 1);
      }
      const currentDay = zoned.getDay();
      const sorted = [...weekdays].sort((a, b) => a - b);
      const nextDay = sorted.find((d) => d > currentDay) ?? sorted[0];
      const daysToAdd = nextDay > currentDay ? nextDay - currentDay : 7 - currentDay + nextDay;
      nextZoned = addDays(zoned, daysToAdd);
    }
  } else {
    return addDays(zoned, 1);
  }

  return fromZonedTime(nextZoned, tz);
}

export function formatReminder(r) {
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
    recurrence_type: r.recurrence_type ?? null,
    recurrence_config: r.recurrence_config ?? null,
    recurrence_end_at: r.recurrence_end_at?.toISOString?.()?.replace(/\.\d{3}Z$/, "Z") ?? null,
    retry_count: r.retry_count ?? 0,
    created_at: r.created_at?.toISOString?.()?.replace(/\.\d{3}Z$/, "Z") ?? r.created_at,
    updated_at: r.updated_at?.toISOString?.()?.replace(/\.\d{3}Z$/, "Z") ?? r.updated_at ?? null,
  };
}
