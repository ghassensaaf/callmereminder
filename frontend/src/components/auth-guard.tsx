"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import { settingsApi } from "@/lib/api";

interface AuthGuardProps {
  children: React.ReactNode;
  requireOrg?: boolean;
}

export function AuthGuard({ children, requireOrg = true }: AuthGuardProps) {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const {
    data: settings,
    isPending: settingsPending,
    isSuccess: settingsSuccess,
    isError: settingsError,
  } = useQuery({
    queryKey: ["settings"],
    queryFn: () => settingsApi.get(),
    enabled: !!session && requireOrg,
  });

  useEffect(() => {
    if (isPending) return;
    if (!session) {
      router.push("/login");
      return;
    }
    if (
      requireOrg &&
      !settingsPending &&
      settingsSuccess &&
      settings &&
      !settings.organizationId
    ) {
      router.push("/onboarding/organization");
    }
  }, [session, isPending, requireOrg, settings, settingsPending, settingsSuccess, router]);

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-surface-500">Loading...</div>
      </div>
    );
  }

  if (!session) return null;

  if (requireOrg && settingsError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-4">
        <p className="text-surface-600 dark:text-surface-400 text-center text-sm">
          Could not load your workspace. Check your connection and try again.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
        >
          Refresh page
        </button>
      </div>
    );
  }

  if (
    requireOrg &&
    (settingsPending || (settingsSuccess && !settings?.organizationId))
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-surface-500">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}
