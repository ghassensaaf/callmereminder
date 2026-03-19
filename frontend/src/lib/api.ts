import axios from "axios";
import {
  Reminder,
  ReminderListResponse,
  ReminderCreate,
  ReminderUpdate,
  ReminderStats,
  ReminderExecutionListResponse,
  ReminderExecution,
} from "@/types/reminder";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Reminders API
export const remindersApi = {
  // List reminders with optional filters
  list: async (params?: {
    status?: string;
    search?: string;
    sort?: "scheduled_at_asc" | "scheduled_at_desc" | "updated_at_desc";
    date_from?: string;
    date_to?: string;
    page?: number;
    page_size?: number;
  }): Promise<ReminderListResponse> => {
    const response = await api.get("/api/reminders", { params });
    return response.data;
  },

  // List reminder executions (history)
  listExecutions: async (params?: {
    page?: number;
    page_size?: number;
    date_from?: string;
    date_to?: string;
  }): Promise<ReminderExecutionListResponse> => {
    const response = await api.get("/api/reminders/executions", { params });
    return response.data;
  },

  /** Fetch transcript / recording info from Vapi for a completed call */
  syncExecutionCallLog: async (executionId: number): Promise<ReminderExecution> => {
    const response = await api.post(`/api/reminders/executions/${executionId}/sync-call-log`);
    return response.data;
  },

  // Get a single reminder
  get: async (id: number): Promise<Reminder> => {
    const response = await api.get(`/api/reminders/${id}`);
    return response.data;
  },

  // Create a new reminder
  create: async (data: ReminderCreate): Promise<Reminder> => {
    const response = await api.post("/api/reminders", data);
    return response.data;
  },

  // Update a reminder
  update: async (id: number, data: ReminderUpdate): Promise<Reminder> => {
    const response = await api.put(`/api/reminders/${id}`, data);
    return response.data;
  },

  // Delete a reminder
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/reminders/${id}`);
  },

  // Bulk delete completed/failed reminders
  bulkDelete: async (ids: number[]): Promise<{ deleted: number }> => {
    const response = await api.post("/api/reminders/bulk-delete", { ids });
    return response.data;
  },

  // Get stats
  stats: async (): Promise<ReminderStats> => {
    const response = await api.get("/api/stats");
    return response.data;
  },
};

// Templates API
export const templatesApi = {
  list: async (): Promise<{ id: number; title: string; message: string; created_at: string }[]> => {
    const response = await api.get("/api/templates");
    return response.data;
  },
  create: async (data: { title: string; message: string }) => {
    const response = await api.post("/api/templates", data);
    return response.data;
  },
  delete: async (id: number) => {
    await api.delete(`/api/templates/${id}`);
  },
};

// Settings API (Vapi keys)
export const settingsApi = {
  get: async (): Promise<{ vapiApiKeyDisplay: string | null; vapiPhoneNumberId: string | null; hasVapiKeys: boolean }> => {
    const response = await api.get("/api/settings");
    return response.data;
  },
  update: async (data: { vapiApiKey?: string; vapiPhoneNumberId?: string }) => {
    const response = await api.put("/api/settings", data);
    return response.data;
  },
  test: async (data: { vapiApiKey: string; vapiPhoneNumberId: string }) => {
    const response = await api.post("/api/settings/test", data);
    return response.data as { valid: boolean };
  },
  delete: async () => {
    const response = await api.delete("/api/settings");
    return response.data as { vapiApiKeyDisplay: null; vapiPhoneNumberId: null; hasVapiKeys: false };
  },
};

export default api;
