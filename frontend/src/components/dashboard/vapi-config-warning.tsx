"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Settings } from "lucide-react";
import { settingsApi } from "@/lib/api";
import { cn } from "@/lib/utils";

export function VapiConfigWarning() {
  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: () => settingsApi.get(),
  });

  if (isLoading || settings?.hasVapiKeys) return null;

  return (
    <div
      role="alert"
      className="flex items-center gap-4 p-4 rounded-xl border border-warning-200 dark:border-warning-800 bg-warning-50 dark:bg-warning-950/40 text-warning-800 dark:text-warning-200"
    >
      <AlertTriangle className="h-5 w-5 flex-shrink-0 text-warning-600 dark:text-warning-400" />
      <div className="flex-1 min-w-0">
        <p className="font-medium">Vapi not configured</p>
        <p className="text-sm text-warning-700 dark:text-warning-300 mt-0.5">
          Voice reminders won&apos;t work until you add your Vapi API key and phone number ID in Settings.
        </p>
      </div>
      <Link
        href="/settings"
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-xl",
          "border-2 border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-200",
          "hover:border-primary-500 dark:hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/50",
          "transition-all duration-200"
        )}
      >
        <Settings className="h-4 w-4" />
        Configure
      </Link>
    </div>
  );
}
