"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { authClient, useSession } from "@/lib/auth-client";
import Image from "next/image";
import { Button, Card } from "@/components/ui";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");
  const { data: session } = useSession();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const verified = !urlError && session?.user?.emailVerified;

  async function resendVerification() {
    if (!session?.user?.email) return;
    setResending(true);
    try {
      await authClient.sendVerificationEmail({
        email: session.user.email,
        callbackURL: "/dashboard",
      });
      setResent(true);
    } catch {
      // silently fail
    } finally {
      setResending(false);
    }
  }

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
          {urlError ? (
            <>
              <h1 className="text-2xl font-display font-bold text-surface-900 dark:text-surface-50 mb-2">
                Verification failed
              </h1>
              <p className="text-surface-500 dark:text-surface-400 text-sm mb-4">
                This verification link is invalid or has expired.
              </p>
              {session?.user?.email && !resent ? (
                <Button onClick={resendVerification} isLoading={resending} className="w-full mb-3">
                  Resend verification email
                </Button>
              ) : resent ? (
                <div className="p-4 rounded-lg bg-success-50 dark:bg-success-950/30 text-success-700 dark:text-success-300 text-sm mb-4">
                  A new verification email has been sent. Check your inbox.
                </div>
              ) : null}
              <Link href="/login">
                <Button variant="outline" className="w-full">Go to sign in</Button>
              </Link>
            </>
          ) : verified ? (
            <>
              <h1 className="text-2xl font-display font-bold text-surface-900 dark:text-surface-50 mb-2">
                Email verified
              </h1>
              <div className="p-4 rounded-lg bg-success-50 dark:bg-success-950/30 text-success-700 dark:text-success-300 text-sm mb-4">
                Your email has been verified successfully.
              </div>
              <Link href="/dashboard">
                <Button className="w-full">Go to dashboard</Button>
              </Link>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-display font-bold text-surface-900 dark:text-surface-50 mb-2">
                Check your email
              </h1>
              <p className="text-surface-500 dark:text-surface-400 text-sm mb-4">
                We&apos;ve sent a verification link to your email address.
                Click the link to verify your account.
              </p>
              {session?.user?.email && !resent ? (
                <Button onClick={resendVerification} isLoading={resending} variant="outline" className="w-full mb-3">
                  Resend verification email
                </Button>
              ) : resent ? (
                <div className="p-4 rounded-lg bg-success-50 dark:bg-success-950/30 text-success-700 dark:text-success-300 text-sm mb-4">
                  A new verification email has been sent. Check your inbox.
                </div>
              ) : null}
              <Link href="/dashboard">
                <Button variant="ghost" className="w-full">Continue to dashboard</Button>
              </Link>
            </>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
