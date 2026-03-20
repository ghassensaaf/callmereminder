"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";

import { Header } from "@/components/layout";
import { AuthGuard } from "@/components/auth-guard";
import { FilterTabs, SearchInput, VapiConfigWarning } from "@/components/dashboard";
import { ReminderForm, ReminderList, ExecutionList, StatsCards } from "@/components/reminder";
import { Button, Modal } from "@/components/ui";
import { settingsApi } from "@/lib/api";
import { ReminderStatus } from "@/types/reminder";

type FilterOption = ReminderStatus | "all" | "history";

export default function DashboardPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filter, setFilter] = useState<FilterOption>("all");
  const [search, setSearch] = useState("");
  const [historyDateFrom, setHistoryDateFrom] = useState("");
  const [historyDateTo, setHistoryDateTo] = useState("");
  const [listDateFrom, setListDateFrom] = useState("");
  const [listDateTo, setListDateTo] = useState("");

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: () => settingsApi.get(),
  });
  const needsVapiSetup = settings != null && settings.hasVapiKeys === false;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "n" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (needsVapiSetup) return;
        setIsCreateModalOpen(true);
      }
      if (e.key === "Escape") {
        setIsCreateModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [needsVapiSetup]);

  return (
    <AuthGuard>
    <div className="min-h-screen">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-surface-900 dark:text-surface-50 mb-2">
              Your Reminders
            </h1>
            <p className="text-surface-500 dark:text-surface-400 text-lg">
              Stay on top of your schedule with voice call reminders
            </p>
          </div>
          <Button
            onClick={() => !needsVapiSetup && setIsCreateModalOpen(true)}
            disabled={needsVapiSetup}
            leftIcon={<Plus className="h-4 w-4" />}
            className="w-full sm:w-auto shrink-0"
            title={
              needsVapiSetup
                ? "Add a Vapi integration with a phone number in Settings first"
                : "Shortcut: Ctrl+N or Cmd+N"
            }
          >
            New Reminder
          </Button>
        </motion.div>

        {/* Vapi config warning */}
        <div className="mb-6">
          <VapiConfigWarning />
        </div>

        {/* Stats Cards */}
        <div className="mb-8">
          <StatsCards />
        </div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6"
        >
          <FilterTabs value={filter} onChange={setFilter} />
          <SearchInput
            value={search}
            onChange={setSearch}
            className="w-full sm:w-72"
          />
        </motion.div>

        {/* Reminder List or History */}
        {filter === "history" ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <label className="text-sm text-surface-600 dark:text-surface-400">
                From:{" "}
                <input
                  type="date"
                  value={historyDateFrom}
                  onChange={(e) => setHistoryDateFrom(e.target.value)}
                  className="ml-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-3 py-1.5 text-sm"
                />
              </label>
              <label className="text-sm text-surface-600 dark:text-surface-400">
                To:{" "}
                <input
                  type="date"
                  value={historyDateTo}
                  onChange={(e) => setHistoryDateTo(e.target.value)}
                  className="ml-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-3 py-1.5 text-sm"
                />
              </label>
            </div>
            <ExecutionList
              dateFrom={historyDateFrom || undefined}
              dateTo={historyDateTo || undefined}
              onCreateClick={() => !needsVapiSetup && setIsCreateModalOpen(true)}
              needsVapiSetup={needsVapiSetup}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {(filter === "completed" || filter === "failed" || filter === "all") && (
              <div className="flex flex-wrap items-center gap-4">
                <label className="text-sm text-surface-600 dark:text-surface-400">
                  From:{" "}
                  <input
                    type="date"
                    value={listDateFrom}
                    onChange={(e) => setListDateFrom(e.target.value)}
                    className="ml-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-3 py-1.5 text-sm"
                  />
                </label>
                <label className="text-sm text-surface-600 dark:text-surface-400">
                  To:{" "}
                  <input
                    type="date"
                    value={listDateTo}
                    onChange={(e) => setListDateTo(e.target.value)}
                    className="ml-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-3 py-1.5 text-sm"
                  />
                </label>
              </div>
            )}
            <ReminderList
              status={filter}
              search={search}
              dateFrom={listDateFrom || undefined}
              dateTo={listDateTo || undefined}
              onCreateClick={() => !needsVapiSetup && setIsCreateModalOpen(true)}
              needsVapiSetup={needsVapiSetup}
            />
          </div>
        )}
      </main>

      {/* Create Reminder Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Reminder"
        description="Set up a voice call reminder to help you stay on track"
        size="md"
      >
        <ReminderForm
          onSuccess={() => setIsCreateModalOpen(false)}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>
    </div>
    </AuthGuard>
  );
}
