"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { authClient, useSession } from "@/lib/auth-client";
import Image from "next/image";
import { Button, Card } from "@/components/ui";
import { absoluteUrl } from "@/lib/site-url";

function resolvePostVerifyRedirect(callbackParam: string | null): string {
  const fallback = "/dashboard";
  const raw = callbackParam?.trim() || fallback;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  return absoluteUrl(raw.startsWith("/") ? raw : `/${raw}`);
}

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const urlError = searchParams.get("error");
  const callbackParam = searchParams.get("callbackURL");

  const { data: session, isPending: sessionPending } = useSession();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [verifyPhase, setVerifyPhase] = useState<"idle" | "verifying" | "failed">("idle");

  useEffect(() => {
    if (urlError || !token) return;
    let cancelled = false;
    setVerifyPhase("verifying");
    authClient
      .verifyEmail({ query: { token } })
      .then((res) => {
        if (cancelled) return;
        if (res.error) {
          setVerifyPhase("failed");
          return;
        }
        const dest = resolvePostVerifyRedirect(callbackParam);
        window.location.assign(dest);
      })
      .catch(() => {
        if (!cancelled) setVerifyPhase("failed");
      });
    return () => {
      cancelled = true;
    };
  }, [token, urlError, callbackParam]);

  async function resendVerification() {
    if (!session?.user?.email) return;
    setResending(true);
    try {
      await authClient.sendVerificationEmail({
        email: session.user.email,
        callbackURL: absoluteUrl("/dashboard"),
      });
      setResent(true);
    } catch {
      // silently fail
    } finally {
      setResending(false);
    }
  }

  if (token && !urlError && (verifyPhase === "idle" || verifyPhase === "verifying")) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
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
          <Card variant="elevated" className="p-8">
            <h1 className="text-2xl font-display font-bold text-surface-900 dark:text-surface-50 mb-2">
              Verifying your email…
            </h1>
            <p className="text-surface-500 dark:text-surface-400 text-sm">
              Please wait. You will be redirected when verification completes.
            </p>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (token && !urlError && verifyPhase === "failed") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <Link href="/" className="flex items-center gap-3 justify-center mb-8 group">
            <Image src="/logo.png" alt="Dialcues" width={48} height={48} className="h-12 w-12 object-contain" priority />
            <span className="font-display font-bold text-xl text-surface-900 dark:text-surface-50">Dialcues</span>
          </Link>
          <Card variant="elevated" className="p-8 text-center">
            <h1 className="text-2xl font-display font-bold text-surface-900 dark:text-surface-50 mb-2">
              Verification failed
            </h1>
            <p className="text-surface-500 dark:text-surface-400 text-sm mb-4">
              This link is invalid or has expired. Request a new one from your account.
            </p>
            <Link href="/login">
              <Button variant="outline" className="w-full">
                Go to sign in
              </Button>
            </Link>
          </Card>
        </motion.div>
      </div>
    );
  }

  const verified = !urlError && session?.user?.emailVerified;

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
              {!sessionPending && session?.user?.email && !resent ? (
                <Button onClick={resendVerification} isLoading={resending} className="w-full mb-3">
                  Resend verification email
                </Button>
              ) : resent ? (
                <div className="p-4 rounded-lg bg-success-50 dark:bg-success-950/30 text-success-700 dark:text-success-300 text-sm mb-4">
                  A new verification email has been sent. Check your inbox.
                </div>
              ) : null}
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  Go to sign in
                </Button>
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
              <Button className="w-full" onClick={() => router.push("/dashboard")}>
                Go to dashboard
              </Button>
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
                <Button variant="ghost" className="w-full">
                  Continue to dashboard
                </Button>
              </Link>
            </>
          )}
        </Card>
      </motion.div>
    </div>
  );
}

function VerifyEmailFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="animate-pulse text-surface-500">Loading...</div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailFallback />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
