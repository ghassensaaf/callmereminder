"use client";

import React, { useRef, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Clock, MessageSquare, Calendar, Repeat } from "lucide-react";
import { motion } from "framer-motion";
import { isValidPhoneNumber } from "libphonenumber-js";

import { Button, Input, Textarea, Select, PhoneInput } from "@/components/ui";
import { TemplateSelector } from "@/components/settings";
import { remindersApi, vapiConfigsApi } from "@/lib/api";
import {
  getTimezones,
  detectTimezone,
  toLocalDateTimeString,
  formatDateTimeForApi,
  getPresetDateTime,
} from "@/lib/utils";
import { Reminder, ReminderCreate, ReminderUpdate, RecurrenceType } from "@/types/reminder";

const reminderSchema = z.object({
  title: z
    .string()
    .min(1, "Please enter a reminder title")
    .max(255, "Title must be 255 characters or less"),
  message: z
    .string()
    .min(1, "Please enter the message you want to hear")
    .max(1000, "Message must be 1000 characters or less"),
  phone_number: z
    .string()
    .min(1, "Please enter your phone number")
    .refine(
      (val) => {
        try {
          return isValidPhoneNumber(val);
        } catch {
          return false;
        }
      },
      "Please enter a valid phone number"
    ),
  scheduled_at: z.string().min(1, "Please select a date and time"),
  timezone: z.string().min(1, "Please select your timezone"),
  recurrence_type: z.enum(["daily", "weekly", "custom"]).optional().nullable(),
  recurrence_config: z.string().optional().nullable(),
  recurrence_end_at: z.string().optional().nullable(),
  vapi_line_id: z.string().optional().nullable(),
});

type ReminderFormData = z.infer<typeof reminderSchema>;

interface ReminderFormProps {
  reminder?: Reminder;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReminderForm({
  reminder,
  onSuccess,
  onCancel,
}: ReminderFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!reminder;
  const phoneInteracted = useRef(false);

  const { data: vapiData } = useQuery({
    queryKey: ["vapi-configs"],
    queryFn: () => vapiConfigsApi.list(),
  });

  const lineOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [];
    for (const c of vapiData?.configs ?? []) {
      for (const n of c.numbers) {
        opts.push({
          value: n.id,
          label: `${c.name} — ${n.nickname}${n.is_default ? " (default line)" : ""}`,
        });
      }
    }
    return opts;
  }, [vapiData]);

  const hasOutboundLines = lineOptions.length > 0;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    getValues,
    trigger,
  } = useForm<ReminderFormData>({
    resolver: zodResolver(reminderSchema),
    mode: "onBlur", // Validate on blur instead of onChange
    defaultValues: {
      title: reminder?.title || "",
      message: reminder?.message || "",
      phone_number: reminder?.phone_number || "",
      scheduled_at: reminder?.scheduled_at
        ? toLocalDateTimeString(new Date(reminder.scheduled_at))
        : "",
      timezone: reminder?.timezone || detectTimezone(),
      recurrence_type: (reminder?.recurrence_type as RecurrenceType) || null,
      recurrence_config: reminder?.recurrence_config || null,
      recurrence_end_at: reminder?.recurrence_end_at
        ? new Date(reminder.recurrence_end_at).toISOString().slice(0, 10)
        : null,
      vapi_line_id: reminder?.vapi_line_id ?? "",
    },
  });

  const defaultLineFromServer = vapiData?.default_line_id ?? "";

  useEffect(() => {
    if (reminder || !hasOutboundLines) return;
    const current = getValues("vapi_line_id");
    if (current) return;
    if (defaultLineFromServer) {
      setValue("vapi_line_id", defaultLineFromServer, { shouldValidate: false });
    }
  }, [reminder, hasOutboundLines, defaultLineFromServer, getValues, setValue]);

  const createMutation = useMutation({
    mutationFn: (data: ReminderCreate) => remindersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast.success("Reminder created successfully!");
      onSuccess?.();
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.detail || "Failed to create reminder";
      toast.error(message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: ReminderUpdate) =>
      remindersApi.update(reminder!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      toast.success("Reminder updated successfully!");
      onSuccess?.();
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.detail || "Failed to update reminder";
      toast.error(message);
    },
  });

  const onSubmit = async (data: ReminderFormData) => {
    // Send the datetime with timezone info - backend will handle conversion
    // Format: "2024-01-21T15:30:00" with timezone field
    const scheduledDateTime = formatDateTimeForApi(data.scheduled_at);

    // Basic validation - check if entered time seems reasonable
    const enteredDate = new Date(data.scheduled_at);
    const now = new Date();

    // Simple check: if the entered date/time is in the past in local time, warn
    // (Backend will do the proper timezone-aware check)
    if (enteredDate < now) {
      toast.error("Please select a future date and time");
      return;
    }

    const base = {
      ...data,
      scheduled_at: scheduledDateTime,
    };
    const recurrence = data.recurrence_type
      ? {
          recurrence_type: data.recurrence_type,
          recurrence_config:
            data.recurrence_type === "custom" && data.recurrence_config
              ? typeof data.recurrence_config === "string"
                ? data.recurrence_config
                : JSON.stringify(data.recurrence_config)
              : null,
          recurrence_end_at: data.recurrence_end_at ? data.recurrence_end_at + "T23:59:59" : null,
        }
      : { recurrence_type: null, recurrence_config: null, recurrence_end_at: null };

    const outbound = !hasOutboundLines
      ? {}
      : {
          vapi_line_id:
            data.vapi_line_id?.trim() ||
            defaultLineFromServer ||
            lineOptions[0]?.value ||
            null,
        };

    if (isEditing) {
      await updateMutation.mutateAsync({ ...base, ...recurrence, ...outbound });
    } else {
      await createMutation.mutateAsync({ ...base, ...recurrence, ...outbound } as ReminderCreate);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Get minimum datetime (now)
  const minDateTime = toLocalDateTimeString(new Date());

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        {/* Templates - only when creating */}
        {!isEditing && (
          <TemplateSelector
            onSelect={(title, message) => {
              setValue("title", title, { shouldValidate: true });
              setValue("message", message, { shouldValidate: true });
            }}
          />
        )}

        {/* Title */}
        <Input
          label="Reminder Title"
          placeholder="e.g., Call mom, Take medication"
          error={errors.title?.message}
          leftIcon={<MessageSquare className="h-4 w-4" />}
          {...register("title")}
        />

        {/* Message */}
        <Textarea
          label="Reminder Message"
          placeholder="The message that will be spoken when you receive the call..."
          hint="This is what you'll hear when the reminder calls you. Create templates in Settings for quick reuse."
          error={errors.message?.message}
          rows={4}
          {...register("message")}
        />

        {/* Phone Number */}
        <PhoneInput
          label="Phone Number"
          placeholder="Enter your phone number"
          error={phoneInteracted.current ? errors.phone_number?.message : undefined}
          value={watch("phone_number")}
          onChange={(value, isValid) => {
            // Only validate if user has actually typed something beyond country code
            const hasTypedDigits = value.replace(/\D/g, "").length > 3;
            if (hasTypedDigits) {
              phoneInteracted.current = true;
            }
            setValue("phone_number", value, { shouldValidate: phoneInteracted.current });
          }}
          onBlur={() => {
            phoneInteracted.current = true;
            trigger("phone_number");
          }}
        />

        {hasOutboundLines && (
          <Select
            label="Call from (Vapi)"
            hint="Uses the API key and caller ID from this line. Default is pre-selected."
            options={lineOptions}
            error={errors.vapi_line_id?.message}
            {...register("vapi_line_id")}
          />
        )}

        {/* Quick presets */}
        <div className="space-y-2">
          <span className="text-sm font-medium text-muted-foreground">Quick presets</span>
          <div className="flex flex-wrap gap-2">
            {(["15min", "1hour", "tomorrow9", "nextMonday9"] as const).map((preset) => (
              <Button
                key={preset}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const tz = watch("timezone") || detectTimezone();
                  setValue("scheduled_at", getPresetDateTime(preset, tz), { shouldValidate: true });
                }}
              >
                {preset === "15min" && "In 15 min"}
                {preset === "1hour" && "In 1 hour"}
                {preset === "tomorrow9" && "Tomorrow 9:00"}
                {preset === "nextMonday9" && "Next Monday 9:00"}
              </Button>
            ))}
          </div>
        </div>

        {/* Date/Time and Timezone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            type="datetime-local"
            label="Date & Time"
            error={errors.scheduled_at?.message}
            min={minDateTime}
            leftIcon={<Calendar className="h-4 w-4" />}
            {...register("scheduled_at")}
          />

          <div className="space-y-2">
            <Select
              label="Timezone"
              options={getTimezones()}
              error={errors.timezone?.message}
              {...register("timezone")}
            />
            {watch("timezone") === detectTimezone() && (
              <p className="text-xs text-muted-foreground">Using your detected timezone</p>
            )}
          </div>
        </div>

        {/* Recurrence */}
        <div className="space-y-2">
          <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Repeat className="h-4 w-4" />
            Recurrence
          </span>
          <div className="flex flex-wrap gap-2">
            {(["none", "daily", "weekly", "custom"] as const).map((opt) => (
              <Button
                key={opt}
                type="button"
                variant={watch("recurrence_type") === (opt === "none" ? null : opt) ? "primary" : "outline"}
                size="sm"
                onClick={() => {
                  setValue("recurrence_type", opt === "none" ? null : opt, { shouldValidate: false });
                  if (opt !== "custom") setValue("recurrence_config", null, { shouldValidate: false });
                }}
              >
                {opt === "none" && "One-time"}
                {opt === "daily" && "Daily"}
                {opt === "weekly" && "Weekly"}
                {opt === "custom" && "Custom"}
              </Button>
            ))}
          </div>
          {watch("recurrence_type") === "custom" && (
            <div className="space-y-3 pt-2">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={!watch("recurrence_config")?.includes("interval_days") ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setValue("recurrence_config", JSON.stringify({ weekdays: [] }), { shouldValidate: false })}
                >
                  Specific days
                </Button>
                <Button
                  type="button"
                  variant={watch("recurrence_config")?.includes("interval_days") ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setValue("recurrence_config", JSON.stringify({ interval_days: 3 }), { shouldValidate: false })}
                >
                  Every N days
                </Button>
              </div>
              {watch("recurrence_config")?.includes("interval_days") ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm">Every</span>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    className="w-16 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-2 py-1 text-sm"
                    value={(() => {
                      try {
                        const c = JSON.parse(watch("recurrence_config") || "{}");
                        return c.interval_days ?? 3;
                      } catch {
                        return 3;
                      }
                    })()}
                    onChange={(e) => {
                      const n = Math.max(1, Math.min(30, parseInt(e.target.value, 10) || 1));
                      setValue("recurrence_config", JSON.stringify({ interval_days: n }), { shouldValidate: false });
                    }}
                  />
                  <span className="text-sm">days</span>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {[0, 1, 2, 3, 4, 5, 6].map((d) => {
                    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                    const config = watch("recurrence_config");
                    let weekdays: number[] = [];
                    try {
                      weekdays = config ? (typeof config === "string" ? JSON.parse(config) : config).weekdays ?? [] : [];
                    } catch {}
                    const isSelected = weekdays.includes(d);
                    return (
                      <Button
                        key={d}
                        type="button"
                        variant={isSelected ? "primary" : "outline"}
                        size="sm"
                        onClick={() => {
                          const next = isSelected ? weekdays.filter((x) => x !== d) : [...weekdays, d].sort((a, b) => a - b);
                          setValue("recurrence_config", JSON.stringify({ weekdays: next }), { shouldValidate: false });
                        }}
                      >
                        {days[d]}
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          {watch("recurrence_type") && (
            <div className="pt-2">
              <Input
                type="date"
                label="End date (optional)"
                {...register("recurrence_end_at")}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3 pt-2">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            isLoading={isLoading}
            className="w-full sm:w-auto sm:min-w-[160px]"
            leftIcon={<Clock className="h-4 w-4" />}
          >
            {isEditing ? "Update Reminder" : "Create Reminder"}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
