import { fromZonedTime } from "date-fns-tz";

export const E164_REGEX = /^\+[1-9]\d{1,14}$/;
export const STATUSES = ["scheduled", "completed", "failed", "in_progress"];

export function toUtc(naiveDateStr, tzName) {
  try {
    const str = typeof naiveDateStr === "string" ? naiveDateStr.replace("Z", "").slice(0, 19) : naiveDateStr;
    return fromZonedTime(str, tzName);
  } catch (err) {
    console.error("Timezone conversion error:", err);
    return new Date(naiveDateStr);
  }
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
    created_at: r.created_at?.toISOString?.()?.replace(/\.\d{3}Z$/, "Z") ?? r.created_at,
    updated_at: r.updated_at?.toISOString?.()?.replace(/\.\d{3}Z$/, "Z") ?? r.updated_at ?? null,
  };
}
