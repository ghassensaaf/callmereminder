"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import { Phone, Trash2, TestTube } from "lucide-react";

import { Button, Input, Card, Badge } from "@/components/ui";
import { settingsApi } from "@/lib/api";

const settingsSchema = z.object({
  vapiApiKey: z.string().min(1, "Please enter your Vapi API key"),
  vapiPhoneNumberId: z.string().min(1, "Please enter your Vapi phone number ID"),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export function VapiConfigSection() {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    mode: "onBlur",
    defaultValues: { vapiApiKey: "", vapiPhoneNumberId: "" },
  });

  const vapiApiKey = watch("vapiApiKey");
  const vapiPhoneNumberId = watch("vapiPhoneNumberId");

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: () => settingsApi.get(),
  });

  useEffect(() => {
    if (settings?.vapiPhoneNumberId) {
      setValue("vapiPhoneNumberId", settings.vapiPhoneNumberId);
    } else {
      setValue("vapiPhoneNumberId", "");
    }
  }, [settings?.vapiPhoneNumberId, setValue]);

  const hasConfig = settings?.hasVapiKeys ?? false;

  async function handleTest() {
    const apiKey = vapiApiKey?.trim() ?? "";
    const phoneId = vapiPhoneNumberId?.trim() ?? "";
    if (!apiKey || !phoneId) {
      toast.error("Please enter both API key and phone number ID to test");
      return;
    }
    setTesting(true);
    try {
      await settingsApi.test({ vapiApiKey: apiKey, vapiPhoneNumberId: phoneId });
      toast.success("Configuration is valid");
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : "Validation failed";
      toast.error(msg || "Invalid configuration");
    } finally {
      setTesting(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Remove Vapi configuration? Voice reminders will stop working until you add new credentials."))
      return;
    setDeleting(true);
    try {
      await settingsApi.delete();
      queryClient.setQueryData(["settings"], {
        vapiApiKeyDisplay: null,
        vapiPhoneNumberId: null,
        hasVapiKeys: false,
      });
      setValue("vapiApiKey", "");
      setValue("vapiPhoneNumberId", "");
      toast.success("Vapi configuration removed");
    } catch {
      toast.error("Failed to remove configuration");
    } finally {
      setDeleting(false);
    }
  }

  async function onSettingsSubmit(data: SettingsFormData) {
    setLoading(true);
    try {
      const updated = await settingsApi.update({
        vapiApiKey: data.vapiApiKey.trim(),
        vapiPhoneNumberId: data.vapiPhoneNumberId.trim(),
      });
      queryClient.setQueryData(["settings"], updated);
      toast.success("Settings saved");
      setValue("vapiApiKey", "");
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.detail : "Failed to save";
      toast.error(msg || "Failed to save settings");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card variant="elevated" className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-surface-900 dark:text-surface-50 flex items-center gap-2">
          <Phone className="h-4 w-4" />
          Vapi Configuration
        </h2>
        {!settingsLoading &&
          (hasConfig ? (
            <Badge variant="success" dot>
              Configured
            </Badge>
          ) : (
            <Badge variant="warning" dot>
              Not configured
            </Badge>
          ))}
      </div>
      <p className="text-sm text-surface-500 dark:text-surface-400 mb-6">
        Add your Vapi API key and phone number ID to enable voice call reminders.{" "}
        <Link href="/docs/vapi" className="text-primary-600 dark:text-primary-400 hover:underline">
          How to get these →
        </Link>
      </p>

      {hasConfig && !isEditing ? (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-surface-500 dark:text-surface-400 mb-1">API Key</p>
            <p className="font-mono text-sm text-surface-900 dark:text-surface-100">
              {settings?.vapiApiKeyDisplay}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-surface-500 dark:text-surface-400 mb-1">Phone Number ID</p>
            <p className="font-mono text-sm text-surface-900 dark:text-surface-100">
              {settings?.vapiPhoneNumberId}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              Change
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-danger-600 dark:text-danger-400 border-danger-200 dark:border-danger-800 hover:bg-danger-50 dark:hover:bg-danger-950/30"
              disabled={deleting}
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              {deleting ? "Removing..." : "Remove"}
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSettingsSubmit)} className="space-y-4" noValidate>
          <Input
            label="Vapi API Key"
            type="password"
            placeholder={hasConfig ? "Enter new API key to update" : "Enter your API key"}
            hint="Your key is stored securely and never shown"
            error={errors.vapiApiKey?.message}
            {...register("vapiApiKey")}
          />
          <Input
            label="Vapi Phone Number ID"
            type="text"
            placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
            error={errors.vapiPhoneNumberId?.message}
            {...register("vapiPhoneNumberId")}
          />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save settings"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={testing || !vapiApiKey?.trim() || !vapiPhoneNumberId?.trim()}
              onClick={handleTest}
            >
              <TestTube className="h-4 w-4 mr-1.5" />
              {testing ? "Testing..." : "Test"}
            </Button>
            {hasConfig && (
              <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      )}
    </Card>
  );
}
