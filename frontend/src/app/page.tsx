"use client";

import { useState } from "react";
import { motion } from "framer-motion";

import { Header } from "@/components/layout";
import { FilterTabs, SearchInput } from "@/components/dashboard";
import { ReminderForm, ReminderList, StatsCards } from "@/components/reminder";
import { Modal, Card } from "@/components/ui";
import { ReminderStatus } from "@/types/reminder";

type FilterOption = ReminderStatus | "all";

export default function DashboardPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filter, setFilter] = useState<FilterOption>("all");
  const [search, setSearch] = useState("");

  return (
    <div className="min-h-screen">
      <Header onCreateClick={() => setIsCreateModalOpen(true)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-surface-900 dark:text-surface-50 mb-2">
            Your Reminders
          </h1>
          <p className="text-surface-500 dark:text-surface-400 text-lg">
            Stay on top of your schedule with voice call reminders
          </p>
        </motion.div>

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

        {/* Reminder List */}
        <ReminderList
          status={filter}
          search={search}
          onCreateClick={() => setIsCreateModalOpen(true)}
        />
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
  );
}
