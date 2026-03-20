"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { History as HistoryIcon } from "lucide-react";

import { Header } from "@/components/layout";
import { ExecutionList } from "@/components/reminder";
import { useSession } from "@/lib/auth-client";

export default function HistoryPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 mb-6"
        >
          ← Back to dashboard
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-6"
        >
          <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-950/50">
                <HistoryIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-surface-900 dark:text-surface-50">
                  Call History
                </h1>
                <p className="text-surface-500 dark:text-surface-400 text-sm sm:text-base">
                  Review completed and failed reminder calls in one place.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="text-sm text-surface-600 dark:text-surface-400">
              From:{" "}
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="ml-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-3 py-1.5 text-sm"
              />
            </label>
            <label className="text-sm text-surface-600 dark:text-surface-400">
              To:{" "}
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="ml-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-3 py-1.5 text-sm"
              />
            </label>
          </div>

          <ExecutionList
            dateFrom={dateFrom || undefined}
            dateTo={dateTo || undefined}
            onCreateClick={() => router.push("/dashboard")}
          />
        </motion.div>
      </main>
    </div>
  );
}
