"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { authClient, useSession } from "@/lib/auth-client";
import { organizationApi } from "@/lib/api";
import Image from "next/image";
import { Button, Card } from "@/components/ui";

type Status = "loading" | "accepting" | "success" | "error" | "needs-auth";

export default function AcceptInvitationPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { data: session, isPending } = useSession();
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isPending) return;

    if (!session) {
      setStatus("needs-auth");
      return;
    }

    setStatus("accepting");
    (async () => {
      let organizationId: string | null = null;
      try {
        const inv = await organizationApi.getInvitation(id as string);
        organizationId = inv?.organizationId ?? null;
      } catch {
        /* continue; accept may still succeed */
      }
      const result = await authClient.organization.acceptInvitation({ invitationId: id });
      if (result.error) {
        setErrorMsg(result.error.message || "Failed to accept invitation.");
        setStatus("error");
        return;
      }
      if (organizationId) {
        try {
          await organizationApi.setActive(organizationId);
        } catch {
          /* ignore */
        }
      }
      await queryClient.refetchQueries({ queryKey: ["settings"] });
      await queryClient.refetchQueries({ queryKey: ["organizations"] });
      setStatus("success");
      setTimeout(() => {
        window.location.assign("/dashboard");
      }, 1500);
    })().catch(() => {
      setErrorMsg("Something went wrong. Please try again.");
      setStatus("error");
    });
  }, [id, session, isPending, queryClient]);

  const redirectParam = encodeURIComponent(`/accept-invitation/${id}`);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Link href="/" className="flex items-center gap-3 justify-center mb-8 group">
          <Image
            src="/logo.png"
            alt="Dialcues"
            width={48}
            height={48}
            className="h-12 w-12 object-contain"
            priority
          />
          <span className="font-display font-bold text-xl text-surface-900 dark:text-surface-50">
            Dialcues
          </span>
        </Link>

        <Card variant="elevated" className="p-8 text-center">
          {status === "needs-auth" && (
            <>
              <h1 className="text-2xl font-display font-bold text-surface-900 dark:text-surface-50 mb-2">
                Sign in to continue
              </h1>
              <p className="text-surface-500 dark:text-surface-400 text-sm mb-6">
                You need to sign in or create an account to accept this invitation.
              </p>
              <div className="space-y-3">
                <Link href={`/login?redirect=${redirectParam}`}>
                  <Button className="w-full">Sign in</Button>
                </Link>
                <Link href={`/signup?redirect=${redirectParam}`}>
                  <Button variant="outline" className="w-full">
                    Create account
                  </Button>
                </Link>
              </div>
            </>
          )}

          {(status === "loading" || status === "accepting") && (
            <>
              <h1 className="text-2xl font-display font-bold text-surface-900 dark:text-surface-50 mb-2">
                Accepting invitation...
              </h1>
              <p className="text-surface-500 dark:text-surface-400">
                {status === "loading" ? "Checking your session..." : "Joining the organization..."}
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <h1 className="text-2xl font-display font-bold text-surface-900 dark:text-surface-50 mb-2">
                You&apos;re in!
              </h1>
              <div className="p-4 rounded-lg bg-success-50 dark:bg-success-950/30 text-success-700 dark:text-success-300 text-sm mb-4">
                You&apos;ve successfully joined the organization. Redirecting...
              </div>
              <Link href="/dashboard">
                <Button variant="outline" className="w-full">
                  Go to dashboard
                </Button>
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <h1 className="text-2xl font-display font-bold text-surface-900 dark:text-surface-50 mb-2">
                Invitation failed
              </h1>
              <div className="p-4 rounded-lg bg-danger-50 dark:bg-danger-950/30 text-danger-700 dark:text-danger-300 text-sm mb-4">
                {errorMsg}
              </div>
              <Link href="/dashboard">
                <Button className="w-full">Go to dashboard</Button>
              </Link>
            </>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
