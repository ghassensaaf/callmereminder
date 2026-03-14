"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useSession } from "@/lib/auth-client";
import { Settings } from "lucide-react";

import { Header } from "@/components/layout";
import { VapiConfigSection, TemplatesSection } from "@/components/settings";

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  if (isPending || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-surface-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 mb-6"
        >
          ← Back to dashboard
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-950/50">
              <Settings className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-surface-900 dark:text-surface-50">
                Settings
              </h1>
              <p className="text-surface-500 dark:text-surface-400 text-sm">
                Configure your account and preferences
              </p>
            </div>
          </div>

          <VapiConfigSection />
          <TemplatesSection />
        </motion.div>
      </main>
    </div>
  );
}
