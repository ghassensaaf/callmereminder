"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (isPending) return;
    if (!session?.user) {
      router.push("/login");
      return;
    }

    const adminEmails = (process.env.NEXT_PUBLIC_BLOG_ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    const userEmail = session.user.email?.toLowerCase() || "";
    if (adminEmails.length > 0 && adminEmails.includes(userEmail)) {
      setAuthorized(true);
    } else {
      router.push("/dashboard");
    }
  }, [session, isPending, router]);

  if (isPending || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-surface-500">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}
