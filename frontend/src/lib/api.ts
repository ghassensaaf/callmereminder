import axios from "axios";
import { Reminder, ReminderListResponse, ReminderCreate, ReminderUpdate, ReminderStats } from "@/types/reminder";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Reminders API
export const remindersApi = {
  // List reminders with optional filters
  list: async (params?: {
    status?: string;
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<ReminderListResponse> => {
    const response = await api.get("/api/reminders", { params });
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

  // Get stats
  stats: async (): Promise<ReminderStats> => {
    const response = await api.get("/api/stats");
    return response.data;
  },
};

export default api;
