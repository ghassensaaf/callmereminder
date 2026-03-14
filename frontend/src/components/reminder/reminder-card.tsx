"use client";

import { useState } from "react";
import { addMinutes, addHours } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Phone,
  Clock,
  Calendar,
  Trash2,
  Pencil,
  AlertCircle,
  CheckCircle,
  Timer,
  RotateCcw,
  Bell,
  Copy,
} from "lucide-react";
import { motion } from "framer-motion";

import { Card, Badge, Button, Modal, Input } from "@/components/ui";
import { ReminderForm } from "./reminder-form";
import { remindersApi } from "@/lib/api";
import {
  formatDateTime,
  formatTimeRemaining,
  formatRelativeTime,
  maskPhoneNumber,
  cn,
  formatDateTimeForApi,
  getPresetDateTime,
  formatRecurrencePreview,
} from "@/lib/utils";
import { Reminder, ReminderStatus } from "@/types/reminder";

/**
 * Parse and format error messages from Vapi API for user-friendly display
 */
function formatErrorMessage(errorMessage: string): string {
  if (!errorMessage) return "An unknown error occurred";

  // Try to extract the message from Vapi JSON error format
  // Format: "Vapi API error: 400 - {"statusCode":400,"message":"...","error":"..."}"
  try {
    // Check if it contains JSON
    const jsonMatch = errorMessage.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      // Return the message field if it exists
      if (parsed.message) {
        return parsed.message;
      }
      if (parsed.error) {
        return parsed.error;
      }
    }
  } catch {
    // If JSON parsing fails, continue with other methods
  }

  // Remove common prefixes
  let cleaned = errorMessage
    .replace(/^Error:\s*/i, "")
    .replace(/^Vapi API error:\s*\d+\s*-?\s*/i, "");

  // If still contains JSON-like content, try to extract readable parts
  if (cleaned.includes("{") && cleaned.includes("}")) {
    const beforeJson = cleaned.split("{")[0].trim();
    if (beforeJson) {
      return beforeJson;
    }
  }

  // Truncate if too long
  if (cleaned.length > 200) {
    return cleaned.substring(0, 200) + "...";
  }

  return cleaned || "An error occurred while making the call";
}

interface ReminderCardProps {
  reminder: Reminder;
  index?: number;
}

const statusConfig: Record<
  ReminderStatus,
  { label: string; variant: "primary" | "success" | "danger" | "warning"; icon: typeof Clock; pulse?: boolean }
> = {
  paused: {
    label: "Paused",
    variant: "warning",
    icon: Bell,
  },
  scheduled: {
    label: "Scheduled",
    variant: "primary",
    icon: Clock,
    pulse: true,
  },
  in_progress: {
    label: "In Progress",
    variant: "warning",
    icon: Timer,
    pulse: true,
  },
  completed: {
    label: "Completed",
    variant: "success",
    icon: CheckCircle,
  },
  failed: {
    label: "Failed",
    variant: "danger",
    icon: AlertCircle,
  },
};

export function ReminderCard({ reminder, index = 0 }: ReminderCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [rescheduleDateTime, setRescheduleDateTime] = useState("");
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const queryClient = useQueryClient();

  const openRescheduleModal = () => {
    const snoozedUtc = addMinutes(new Date(reminder.scheduled_at), 10);
    const str = formatInTimeZone(snoozedUtc, reminder.timezone, "yyyy-MM-dd'T'HH:mm");
    setRescheduleDateTime(str);
    setIsRescheduleModalOpen(true);
  };

  const updateMutation = useMutation({
    mutationFn: (data: { scheduled_at: string; timezone: string }) =>
      remindersApi.update(reminder.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast.success("Reminder rescheduled");
      setIsRescheduleModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Failed to reschedule");
    },
  });

  const snoozeMutation = useMutation({
    mutationFn: (duration: "10min" | "1hour" | "tomorrow") => {
      const tz = reminder.timezone;
      let str: string;
      if (duration === "10min") {
        const d = addMinutes(new Date(reminder.scheduled_at), 10);
        str = formatInTimeZone(d, tz, "yyyy-MM-dd'T'HH:mm:ss");
      } else if (duration === "1hour") {
        const d = addHours(new Date(reminder.scheduled_at), 1);
        str = formatInTimeZone(d, tz, "yyyy-MM-dd'T'HH:mm:ss");
      } else {
        str = getPresetDateTime("tomorrow9", tz) + ":00";
      }
      return remindersApi.update(reminder.id, { scheduled_at: str, timezone: tz });
    },
    onSuccess: (_, duration) => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      const msg = duration === "10min" ? "10 minutes" : duration === "1hour" ? "1 hour" : "tomorrow 9:00";
      toast.success(`Snoozed until ${msg}`);
    },
    onError: () => toast.error("Failed to snooze"),
  });

  const duplicateMutation = useMutation({
    mutationFn: () =>
      remindersApi.create({
        title: reminder.title,
        message: reminder.message,
        phone_number: reminder.phone_number,
        scheduled_at: getPresetDateTime("1hour", reminder.timezone) + ":00",
        timezone: reminder.timezone,
        recurrence_type: reminder.recurrence_type ?? undefined,
        recurrence_config: reminder.recurrence_config ?? undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast.success("Reminder duplicated");
    },
    onError: () => toast.error("Failed to duplicate"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => remindersApi.delete(reminder.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast.success("Reminder deleted");
      setIsDeleteConfirmOpen(false);
    },
    onError: () => {
      toast.error("Failed to delete reminder");
    },
  });

  const status = statusConfig[reminder.status];
  const StatusIcon = status.icon;
  const isEditable = reminder.status === "scheduled";
  const canReschedule = reminder.status === "scheduled" || reminder.status === "failed";
  const canSnooze = reminder.status === "scheduled";
  const canPause = reminder.status === "scheduled" && reminder.recurrence_type;
  const canResume = reminder.status === "paused";
  const timeRemaining = formatTimeRemaining(reminder.scheduled_at);
  const isPastDue = timeRemaining === "Past due";

  const handleRescheduleSubmit = () => {
    if (!rescheduleDateTime) {
      toast.error("Please select a date and time");
      return;
    }
    const scheduledStr = formatDateTimeForApi(rescheduleDateTime);
    updateMutation.mutate({ scheduled_at: scheduledStr, timezone: reminder.timezone });
  };

  const pauseMutation = useMutation({
    mutationFn: () => remindersApi.update(reminder.id, { status: "paused" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast.success("Reminder paused");
    },
    onError: () => toast.error("Failed to pause"),
  });

  const resumeMutation = useMutation({
    mutationFn: () => remindersApi.update(reminder.id, { status: "scheduled" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast.success("Reminder resumed");
    },
    onError: () => toast.error("Failed to resume"),
  });

  const handleRetry = () => {
    const str = formatInTimeZone(
      addMinutes(new Date(), 1),
      reminder.timezone,
      "yyyy-MM-dd'T'HH:mm:ss"
    );
    updateMutation.mutate({ scheduled_at: str, timezone: reminder.timezone });
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
      >
        <Card
          variant="default"
          padding="none"
          className={cn(
            "group transition-all duration-300",
            "hover:shadow-lg hover:shadow-surface-900/5 dark:hover:shadow-black/30 hover:-translate-y-0.5",
            reminder.status === "failed" && "border-danger-200/50 dark:border-danger-500/30"
          )}
        >
          <div className="p-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-surface-900 dark:text-surface-50 truncate mb-1">
                  {reminder.title}
                </h3>
                <div className="flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400">
                  <Phone className="h-3.5 w-3.5" />
                  <span className="font-mono">
                    {maskPhoneNumber(reminder.phone_number)}
                  </span>
                </div>
              </div>
              <Badge
                variant={status.variant}
                size="sm"
                dot
                pulse={status.pulse}
              >
                {status.label}
              </Badge>
            </div>

            {/* Message preview */}
            <p className="text-sm text-surface-600 dark:text-surface-300 line-clamp-2 mb-4">
              {reminder.message}
            </p>

            {/* Recurrence preview */}
            {reminder.recurrence_type && reminder.status === "scheduled" && (
              <p className="text-xs text-primary-600 dark:text-primary-400 mb-2">
                {formatRecurrencePreview(
                  reminder.recurrence_type,
                  reminder.recurrence_config,
                  reminder.scheduled_at,
                  reminder.timezone
                )}
              </p>
            )}
            {/* Time info */}
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5 text-surface-500 dark:text-surface-400">
                <Calendar className="h-3.5 w-3.5" />
                <span>{formatDateTime(reminder.scheduled_at, reminder.timezone)}</span>
              </div>
              {reminder.status === "scheduled" && (
                <div
                  className={cn(
                    "flex items-center gap-1.5 font-medium",
                    isPastDue ? "text-danger-500" : "text-primary-600 dark:text-primary-400"
                  )}
                >
                  <Timer className="h-3.5 w-3.5" />
                  <span>{timeRemaining}</span>
                </div>
              )}
              {(reminder.status === "completed" || reminder.status === "failed") &&
                reminder.updated_at && (
                  <div className="flex items-center gap-1.5 text-surface-500 dark:text-surface-400">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Ran {formatRelativeTime(reminder.updated_at)}</span>
                  </div>
                )}
            </div>

            {/* Error message if failed */}
            {reminder.status === "failed" && reminder.error_message && (
              <div className="mt-3 p-3 bg-danger-50 dark:bg-danger-950/30 rounded-lg border border-danger-100 dark:border-danger-800/50">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-danger-500 dark:text-danger-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-danger-700 dark:text-danger-300">
                    {formatErrorMessage(reminder.error_message)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-1 px-5 py-3 bg-surface-50/50 dark:bg-surface-800/50 border-t border-surface-100 dark:border-surface-800">
            {(isEditable || reminder.status === "completed" || canResume) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => duplicateMutation.mutate()}
                leftIcon={<Copy className="h-3.5 w-3.5" />}
                isLoading={duplicateMutation.isPending}
              >
                Duplicate
              </Button>
            )}
            {(isEditable || canResume) && (
              <>
                {isEditable && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditModalOpen(true)}
                  leftIcon={<Pencil className="h-3.5 w-3.5" />}
                >
                  Edit
                </Button>
                )}
                {canSnooze && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => snoozeMutation.mutate("10min")}
                      leftIcon={<Bell className="h-3.5 w-3.5" />}
                      isLoading={snoozeMutation.isPending}
                    >
                      10 min
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => snoozeMutation.mutate("1hour")}
                      isLoading={snoozeMutation.isPending}
                    >
                      1 hr
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => snoozeMutation.mutate("tomorrow")}
                      isLoading={snoozeMutation.isPending}
                    >
                      Tomorrow 9am
                    </Button>
                  </>
                )}
                {canPause && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => pauseMutation.mutate()}
                    isLoading={pauseMutation.isPending}
                  >
                    Pause
                  </Button>
                )}
                {canResume && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => resumeMutation.mutate()}
                    isLoading={resumeMutation.isPending}
                  >
                    Resume
                  </Button>
                )}
                {canReschedule && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={openRescheduleModal}
                    leftIcon={<Calendar className="h-3.5 w-3.5" />}
                  >
                    Reschedule
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                  className="text-danger-600 hover:text-danger-700 dark:text-danger-400 dark:hover:text-danger-300 hover:bg-danger-50 dark:hover:bg-danger-950/30"
                >
                  Delete
                </Button>
              </>
            )}
            {reminder.status === "failed" && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRetry}
                  leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
                  isLoading={updateMutation.isPending}
                >
                  Retry
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={openRescheduleModal}
                  leftIcon={<Calendar className="h-3.5 w-3.5" />}
                >
                  Reschedule
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                  className="text-danger-600 hover:text-danger-700 dark:text-danger-400 dark:hover:text-danger-300 hover:bg-danger-50 dark:hover:bg-danger-950/30"
                >
                  Delete
                </Button>
              </>
            )}
            {reminder.status === "completed" && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDeleteConfirmOpen(true)}
                leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                className="text-danger-600 hover:text-danger-700 dark:text-danger-400 dark:hover:text-danger-300 hover:bg-danger-50 dark:hover:bg-danger-950/30"
                >
                  Delete
                </Button>
              </>
            )}
            {reminder.status === "in_progress" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDeleteConfirmOpen(true)}
                leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                className="text-danger-600 hover:text-danger-700 dark:text-danger-400 dark:hover:text-danger-300 hover:bg-danger-50 dark:hover:bg-danger-950/30"
              >
                Delete
              </Button>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Reminder"
        description="Update your reminder details"
        size="md"
      >
        <ReminderForm
          reminder={reminder}
          onSuccess={() => setIsEditModalOpen(false)}
          onCancel={() => setIsEditModalOpen(false)}
        />
      </Modal>

      {/* Reschedule Modal */}
      <Modal
        isOpen={isRescheduleModalOpen}
        onClose={() => setIsRescheduleModalOpen(false)}
        title="Reschedule Reminder"
        description="Pick a new date and time"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            type="datetime-local"
            label="New date & time"
            value={rescheduleDateTime}
            onChange={(e) => setRescheduleDateTime(e.target.value)}
            min={formatInTimeZone(new Date(), reminder.timezone, "yyyy-MM-dd'T'HH:mm")}
          />
          <p className="text-xs text-surface-500 dark:text-surface-400">
            Times are in {reminder.timezone}
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsRescheduleModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleRescheduleSubmit}
              isLoading={updateMutation.isPending}
            >
              Reschedule
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        title="Delete Reminder"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-surface-600 dark:text-surface-300">
            Are you sure you want to delete &ldquo;{reminder.title}&rdquo;? This
            action cannot be undone.
          </p>
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setIsDeleteConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteMutation.mutate()}
              isLoading={deleteMutation.isPending}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
