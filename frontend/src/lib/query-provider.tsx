"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 30 * 1000, // 30 seconds
          refetchOnWindowFocus: true,
          retry: 1,
        },
      },
    });
    // Org gate + SessionOrganizationSync share this key; avoid focus refetches replacing
    // good data with a transient null and thrashing the AuthGuard redirect.
    client.setQueryDefaults(["settings"], {
      staleTime: 2 * 60 * 1000,
      refetchOnWindowFocus: false,
    });
    return client;
  });

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
