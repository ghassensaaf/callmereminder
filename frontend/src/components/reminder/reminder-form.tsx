"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Clock, MessageSquare, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { isValidPhoneNumber } from "libphonenumber-js";

import { Button, Input, Textarea, Select, PhoneInput } from "@/components/ui";
import { remindersApi } from "@/lib/api";
import {
  getTimezones,
  detectTimezone,
  toLocalDateTimeString,
  formatDateTimeForApi,
} from "@/lib/utils";
import { Reminder, ReminderCreate, ReminderUpdate } from "@/types/reminder";

const reminderSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title is too long"),
  message: z
    .string()
    .min(1, "Message is required")
    .max(1000, "Message is too long"),
  phone_number: z
    .string()
    .min(1, "Phone number is required")
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
  scheduled_at: z.string().min(1, "Date and time is required"),
  timezone: z.string().min(1, "Timezone is required"),
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

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
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
    },
  });

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

    const payload = {
      ...data,
      scheduled_at: scheduledDateTime,
    };

    if (isEditing) {
      await updateMutation.mutateAsync(payload);
    } else {
      await createMutation.mutateAsync(payload);
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
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
          hint="This is what you'll hear when the reminder calls you"
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

          <Select
            label="Timezone"
            options={getTimezones()}
            error={errors.timezone?.message}
            {...register("timezone")}
          />
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
