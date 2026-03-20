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
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl border",
        /* Light: warm panel + dark amber/brown text (high contrast) */
        "border-warning-200/90 bg-warning-50 text-warning-950",
        /* Dark: deep amber tint + light text (never inherit global body color onto a light panel) */
        "dark:border-warning-500/35 dark:bg-warning-950/55 dark:text-warning-50"
      )}
    >
      <AlertTriangle className="h-5 w-5 flex-shrink-0 text-warning-600 dark:text-warning-400" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-warning-900 dark:text-warning-50">Vapi not configured</p>
        <p className="text-sm text-warning-800/90 dark:text-warning-100/90 mt-0.5">
          Voice reminders won&apos;t work until you add your Vapi API key and phone number ID in Settings.
        </p>
      </div>
      <Link
        href="/settings"
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-xl shrink-0",
          "border-2 border-warning-700/25 text-warning-900 bg-white/70 hover:bg-warning-100/80",
          "dark:border-warning-400/40 dark:text-warning-50 dark:bg-warning-900/50 dark:hover:bg-warning-800/55",
          "transition-all duration-200"
        )}
      >
        <Settings className="h-4 w-4" />
        Configure
      </Link>
    </div>
  );
}
