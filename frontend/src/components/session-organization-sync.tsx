"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import { settingsApi } from "@/lib/api";
import api from "@/lib/api";

/**
 * Keeps Better Auth's session `activeOrganizationId` aligned with the user's single membership.
 * Our Express API resolves org from `member`, but the org plugin still reads the session field for some routes.
 */
export function SessionOrganizationSync() {
  const { data: session } = useSession();
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: () => settingsApi.get(),
    enabled: !!session,
  });
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    if (!session?.user?.id) {
      lastKey.current = null;
      return;
    }
    const orgId = settings?.organizationId;
    if (!orgId) return;

    const key = `${session.user.id}:${orgId}`;
    if (lastKey.current === key) return;
    lastKey.current = key;

    void api.post("/api/auth/organization/set-active", { organizationId: orgId }).catch(() => {});
  }, [session?.user?.id, settings?.organizationId]);

  return null;
}
