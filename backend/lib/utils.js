import { addDays, addWeeks, format } from "date-fns";
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
  const localTime = format(zoned, "HH:mm:ss");

  function toUtcAtSameLocalTime(nextLocalDate) {
    const localDate = format(nextLocalDate, "yyyy-MM-dd");
    return fromZonedTime(`${localDate}T${localTime}`, tz);
  }

  let nextLocalDate;
  if (recurrenceType === "daily") {
    nextLocalDate = addDays(zoned, 1);
  } else if (recurrenceType === "weekly") {
    nextLocalDate = addWeeks(zoned, 1);
  } else if (recurrenceType === "custom" && recurrenceConfig) {
    let config;
    try {
      config = typeof recurrenceConfig === "string" ? JSON.parse(recurrenceConfig) : recurrenceConfig;
    } catch {
      return toUtcAtSameLocalTime(addDays(zoned, 1));
    }
    // Every N days: {"interval_days": 3}
    const intervalDays = Number(config.interval_days);
    if (Number.isFinite(intervalDays) && intervalDays >= 1) {
      nextLocalDate = addDays(zoned, Math.min(365, Math.floor(intervalDays)));
    } else {
      // Specific weekdays: {"weekdays":[1,3,5]}
      const weekdays = Array.isArray(config.weekdays)
        ? [...new Set(config.weekdays.map((n) => Number(n)).filter((n) => Number.isInteger(n) && n >= 0 && n <= 6))]
        : [];
      if (!Array.isArray(weekdays) || weekdays.length === 0) {
        return toUtcAtSameLocalTime(addDays(zoned, 1));
      }
      const currentDay = zoned.getDay();
      const sorted = [...weekdays].sort((a, b) => a - b);
      let daysToAdd = sorted
        .map((d) => (d > currentDay ? d - currentDay : 7 - currentDay + d))
        .filter((d) => d > 0)
        .sort((a, b) => a - b)[0];
      if (!daysToAdd) daysToAdd = 7;
      nextLocalDate = addDays(zoned, daysToAdd);
    }
  } else {
    return toUtcAtSameLocalTime(addDays(zoned, 1));
  }

  return toUtcAtSameLocalTime(nextLocalDate);
}

export function formatReminder(r) {
  const line = r.vapiLine;
  const outbound_line_label =
    line?.config?.name != null
      ? `${line.config.name} / ${line.nickname}`
      : line
        ? line.nickname
        : null;
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
    vapi_line_id: r.vapiLineId ?? null,
    outbound_line_label: outbound_line_label,
    recurrence_type: r.recurrence_type ?? null,
    recurrence_config: r.recurrence_config ?? null,
    recurrence_end_at: r.recurrence_end_at?.toISOString?.()?.replace(/\.\d{3}Z$/, "Z") ?? null,
    retry_count: r.retry_count ?? 0,
    created_at: r.created_at?.toISOString?.()?.replace(/\.\d{3}Z$/, "Z") ?? r.created_at,
    updated_at: r.updated_at?.toISOString?.()?.replace(/\.\d{3}Z$/, "Z") ?? r.updated_at ?? null,
  };
}
