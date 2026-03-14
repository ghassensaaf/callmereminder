export type ReminderStatus = "scheduled" | "paused" | "completed" | "failed" | "in_progress";

export type RecurrenceType = "daily" | "weekly" | "custom";

export interface Reminder {
  id: number;
  title: string;
  message: string;
  phone_number: string;
  scheduled_at: string;
  timezone: string;
  status: ReminderStatus;
  call_id?: string;
  error_message?: string;
  recurrence_type?: RecurrenceType | null;
  recurrence_config?: string | null;
  recurrence_end_at?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface ReminderExecution {
  id: number;
  reminder_id: number;
  reminder_title: string | null;
  reminder_message: string | null;
  scheduled_at: string;
  status: "completed" | "failed";
  call_id?: string | null;
  error_message?: string | null;
  executed_at: string;
}

export interface ReminderExecutionListResponse {
  items: ReminderExecution[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ReminderListResponse {
  items: Reminder[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ReminderCreate {
  title: string;
  message: string;
  phone_number: string;
  scheduled_at: string;
  timezone: string;
  recurrence_type?: RecurrenceType | null;
  recurrence_config?: string | Record<string, unknown> | null;
  recurrence_end_at?: string | null;
}

export interface ReminderUpdate {
  title?: string;
  message?: string;
  phone_number?: string;
  scheduled_at?: string;
  timezone?: string;
  recurrence_type?: RecurrenceType | null;
  recurrence_config?: string | Record<string, unknown> | null;
  recurrence_end_at?: string | null;
  status?: ReminderStatus;
}

export interface ReminderStats {
  total: number;
  scheduled: number;
  paused?: number;
  completed: number;
  failed: number;
  in_progress: number;
}
