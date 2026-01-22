export type ReminderStatus = "scheduled" | "completed" | "failed" | "in_progress";

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
  created_at: string;
  updated_at?: string;
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
}

export interface ReminderUpdate {
  title?: string;
  message?: string;
  phone_number?: string;
  scheduled_at?: string;
  timezone?: string;
}

export interface ReminderStats {
  total: number;
  scheduled: number;
  completed: number;
  failed: number;
  in_progress: number;
}
