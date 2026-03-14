import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  formatDistanceToNow,
  format,
  parseISO,
  isPast,
  differenceInMinutes,
  addMinutes,
  addHours,
  addDays,
  setHours,
  setMinutes,
  nextMonday,
  startOfDay,
} from "date-fns";
import { formatInTimeZone, utcToZonedTime } from "date-fns-tz";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateTime(dateString: string, timezone?: string): string {
  const date = parseISO(dateString);
  if (timezone) {
    return formatInTimeZone(date, timezone, "MMM d, yyyy 'at' h:mm a");
  }
  return format(date, "MMM d, yyyy 'at' h:mm a");
}

export function formatTimeRemaining(dateString: string): string {
  const date = parseISO(dateString);
  if (isPast(date)) {
    return "Past due";
  }
  
  const minutesRemaining = differenceInMinutes(date, new Date());
  
  if (minutesRemaining < 1) {
    return "Less than a minute";
  }
  
  if (minutesRemaining < 60) {
    return `${minutesRemaining} minute${minutesRemaining === 1 ? '' : 's'}`;
  }
  
  return formatDistanceToNow(date, { addSuffix: false });
}

export function formatRelativeTime(dateString: string): string {
  const date = parseISO(dateString);
  return formatDistanceToNow(date, { addSuffix: true });
}

export function maskPhoneNumber(phone: string): string {
  if (phone.length <= 4) return phone;
  const visibleEnd = phone.slice(-4);
  const hiddenPart = phone.slice(0, -4).replace(/\d/g, "•");
  return hiddenPart + visibleEnd;
}

export function isValidE164(phone: string): boolean {
  const pattern = /^\+[1-9]\d{1,14}$/;
  return pattern.test(phone);
}

// Timezone labels mapping for common timezones
const timezoneLabels: Record<string, string> = {
  "America/New_York": "Eastern Time (ET)",
  "America/Chicago": "Central Time (CT)",
  "America/Denver": "Mountain Time (MT)",
  "America/Los_Angeles": "Pacific Time (PT)",
  "America/Anchorage": "Alaska Time (AKT)",
  "Pacific/Honolulu": "Hawaii Time (HT)",
  "Europe/London": "London (GMT/BST)",
  "Europe/Paris": "Paris (CET/CEST)",
  "Europe/Berlin": "Berlin (CET/CEST)",
  "Europe/Madrid": "Madrid (CET/CEST)",
  "Europe/Rome": "Rome (CET/CEST)",
  "Europe/Amsterdam": "Amsterdam (CET/CEST)",
  "Europe/Brussels": "Brussels (CET/CEST)",
  "Europe/Zurich": "Zurich (CET/CEST)",
  "Europe/Vienna": "Vienna (CET/CEST)",
  "Europe/Warsaw": "Warsaw (CET/CEST)",
  "Europe/Stockholm": "Stockholm (CET/CEST)",
  "Europe/Oslo": "Oslo (CET/CEST)",
  "Europe/Copenhagen": "Copenhagen (CET/CEST)",
  "Europe/Helsinki": "Helsinki (EET/EEST)",
  "Europe/Athens": "Athens (EET/EEST)",
  "Europe/Istanbul": "Istanbul (TRT)",
  "Europe/Moscow": "Moscow (MSK)",
  "Asia/Tokyo": "Tokyo (JST)",
  "Asia/Shanghai": "Shanghai (CST)",
  "Asia/Hong_Kong": "Hong Kong (HKT)",
  "Asia/Singapore": "Singapore (SGT)",
  "Asia/Dubai": "Dubai (GST)",
  "Asia/Kolkata": "India (IST)",
  "Asia/Bangkok": "Bangkok (ICT)",
  "Asia/Seoul": "Seoul (KST)",
  "Australia/Sydney": "Sydney (AEDT/AEST)",
  "Australia/Melbourne": "Melbourne (AEDT/AEST)",
  "Australia/Perth": "Perth (AWST)",
  "Pacific/Auckland": "Auckland (NZDT/NZST)",
  "Africa/Cairo": "Cairo (EET)",
  "Africa/Johannesburg": "Johannesburg (SAST)",
  "Africa/Lagos": "Lagos (WAT)",
  "Africa/Tunis": "Tunis (CET)",
  "America/Toronto": "Toronto (ET)",
  "America/Vancouver": "Vancouver (PT)",
  "America/Mexico_City": "Mexico City (CST)",
  "America/Sao_Paulo": "São Paulo (BRT)",
  "America/Buenos_Aires": "Buenos Aires (ART)",
  "UTC": "UTC",
};

export function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "America/New_York";
  }
}

export function getTimezoneLabel(tz: string): string {
  if (timezoneLabels[tz]) {
    return timezoneLabels[tz];
  }
  // Format the timezone name nicely if not in our map
  // e.g., "America/New_York" -> "America/New York"
  return tz.replace(/_/g, " ").replace(/\//g, " / ");
}

export function getTimezones(): { value: string; label: string }[] {
  const detectedTz = detectTimezone();
  
  // Base list of common timezones
  const baseTimezones = [
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/Anchorage",
    "Pacific/Honolulu",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Asia/Tokyo",
    "Asia/Shanghai",
    "Asia/Singapore",
    "Asia/Dubai",
    "Australia/Sydney",
    "UTC",
  ];

  // Add detected timezone if not already in the list
  const allTimezones = baseTimezones.includes(detectedTz)
    ? baseTimezones
    : [detectedTz, ...baseTimezones];

  return allTimezones.map((tz) => ({
    value: tz,
    label: tz === detectedTz ? `${getTimezoneLabel(tz)} (Detected)` : getTimezoneLabel(tz),
  }));
}

export function toLocalDateTimeString(date: Date): string {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
}

/**
 * Get the datetime string as-is from the input (no timezone conversion on frontend)
 * The backend will handle timezone conversion properly
 * @param dateTimeString - The datetime string from datetime-local input (e.g., "2024-01-21T15:30")
 * @returns The datetime string with seconds added
 */
export function formatRecurrencePreview(
  recurrenceType: string | null | undefined,
  recurrenceConfig: string | null | undefined,
  scheduledAt: string,
  timezone?: string
): string {
  if (!recurrenceType) return "";
  const date = parseISO(scheduledAt);
  const tz = timezone || "UTC";
  const timeStr = formatInTimeZone(date, tz, "h:mm a");
  if (recurrenceType === "daily") return `Daily at ${timeStr}`;
  if (recurrenceType === "weekly") {
    const day = formatInTimeZone(date, tz, "EEEE");
    return `${day}s at ${timeStr}`;
  }
  if (recurrenceType === "custom" && recurrenceConfig) {
    try {
      const c = typeof recurrenceConfig === "string" ? JSON.parse(recurrenceConfig) : recurrenceConfig;
      if (c.interval_days) return `Every ${c.interval_days} days at ${timeStr}`;
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const w = (c.weekdays ?? []).map((d: number) => days[d]).filter(Boolean);
      if (w.length) return `${w.join(", ")} at ${timeStr}`;
    } catch {}
  }
  return `Recurring at ${timeStr}`;
}

export function formatDateTimeForApi(dateTimeString: string): string {
  // datetime-local gives "2024-01-21T15:30", we return as-is
  // Backend will interpret this in the context of the provided timezone
  return dateTimeString + ":00";
}

/**
 * Compute preset dates in the given timezone and return datetime-local string for the form.
 */
export function getPresetDateTime(
  preset: "15min" | "1hour" | "tomorrow9" | "nextMonday9",
  timezone: string
): string {
  const tz = timezone || detectTimezone();
  const now = new Date();
  const zonedNow = utcToZonedTime(now, tz);

  let zonedDate: Date;
  switch (preset) {
    case "15min":
      zonedDate = addMinutes(zonedNow, 15);
      break;
    case "1hour":
      zonedDate = addHours(zonedNow, 1);
      break;
    case "tomorrow9":
      zonedDate = setMinutes(setHours(addDays(startOfDay(zonedNow), 1), 9), 0);
      break;
    case "nextMonday9":
      zonedDate = setMinutes(setHours(nextMonday(startOfDay(zonedNow)), 9), 0);
      break;
    default:
      zonedDate = zonedNow;
  }

  return format(zonedDate, "yyyy-MM-dd'T'HH:mm");
}
