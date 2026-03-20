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

  const { data: settings, isLoading: settingsLoading } = useQuery({
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
    if (requireOrg && !settingsLoading && settings && !settings.activeOrganizationId) {
      router.push("/onboarding/organization");
    }
  }, [session, isPending, requireOrg, settings, settingsLoading, router]);

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-surface-500">Loading...</div>
      </div>
    );
  }

  if (!session) return null;

  if (requireOrg && (settingsLoading || !settings?.activeOrganizationId)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-surface-500">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}
