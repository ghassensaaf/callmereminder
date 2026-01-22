"use client";

import { useQuery } from "@tanstack/react-query";
import { Bell, Search, AlertTriangle } from "lucide-react";

import { ReminderCard } from "./reminder-card";
import { SkeletonCard, EmptyState, Button } from "@/components/ui";
import { remindersApi } from "@/lib/api";
import { ReminderStatus } from "@/types/reminder";

interface ReminderListProps {
  status?: ReminderStatus | "all";
  search?: string;
  onCreateClick?: () => void;
}

export function ReminderList({
  status,
  search,
  onCreateClick,
}: ReminderListProps) {
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["reminders", status, search],
    queryFn: () =>
      remindersApi.list({
        status: status && status !== "all" ? status : undefined,
        search: search || undefined,
        page_size: 50,
      }),
    refetchInterval: 10000, // Refetch every 10 seconds to update countdown
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={<AlertTriangle className="h-8 w-8" />}
        title="Failed to load reminders"
        description="Something went wrong while loading your reminders. Please try again."
        action={
          <Button onClick={() => refetch()} variant="primary">
            Try Again
          </Button>
        }
      />
    );
  }

  if (!data?.items.length) {
    if (search) {
      return (
        <EmptyState
          icon={<Search className="h-8 w-8" />}
          title="No results found"
          description={`No reminders matching "${search}". Try adjusting your search or create a new reminder.`}
          action={
            onCreateClick && (
              <Button onClick={onCreateClick} variant="primary">
                Create Reminder
              </Button>
            )
          }
        />
      );
    }

    if (status && status !== "all") {
      const statusLabels: Record<string, string> = {
        scheduled: "scheduled",
        completed: "completed",
        failed: "failed",
        in_progress: "in progress",
      };

      return (
        <EmptyState
          icon={<Bell className="h-8 w-8" />}
          title={`No ${statusLabels[status]} reminders`}
          description={`You don't have any ${statusLabels[status]} reminders yet.`}
          action={
            status === "scheduled" &&
            onCreateClick && (
              <Button onClick={onCreateClick} variant="primary">
                Create Your First Reminder
              </Button>
            )
          }
        />
      );
    }

    return (
      <EmptyState
        icon={<Bell className="h-8 w-8" />}
        title="No reminders yet"
        description="Create your first reminder and never miss an important moment again. We'll call you when it's time!"
        action={
          onCreateClick && (
            <Button onClick={onCreateClick} variant="primary" size="lg">
              Create Your First Reminder
            </Button>
          )
        }
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {data.items.map((reminder, index) => (
        <ReminderCard key={reminder.id} reminder={reminder} index={index} />
      ))}
    </div>
  );
}
