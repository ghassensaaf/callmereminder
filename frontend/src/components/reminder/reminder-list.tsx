"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Bell, Search, AlertTriangle, Trash2 } from "lucide-react";

import { ReminderCard } from "./reminder-card";
import { SkeletonCard, EmptyState, Button } from "@/components/ui";
import { remindersApi } from "@/lib/api";
import { ReminderStatus } from "@/types/reminder";

interface ReminderListProps {
  status?: ReminderStatus | "all";
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  onCreateClick?: () => void;
}

export function ReminderList({
  status,
  search,
  dateFrom,
  dateTo,
  onCreateClick,
}: ReminderListProps) {
  const queryClient = useQueryClient();

  const sort =
    status === "completed" || status === "failed" || status === "paused" ? "updated_at_desc" : "scheduled_at_asc";

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["reminders", status, search, sort, dateFrom, dateTo],
    queryFn: () =>
      remindersApi.list({
        status: status && status !== "all" ? status : undefined,
        search: search || undefined,
        sort,
        date_from: dateFrom,
        date_to: dateTo,
        page_size: 50,
      }),
    refetchInterval: 10000,
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: number[]) => remindersApi.bulkDelete(ids),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast.success(`Deleted ${data.deleted} reminder${data.deleted === 1 ? "" : "s"}`);
    },
    onError: () => toast.error("Failed to delete"),
  });

  const completableItems = data?.items.filter((r) => r.status === "completed" || r.status === "failed") ?? [];
  const showBulkDelete = (status === "completed" || status === "failed" || status === "all") && completableItems.length > 0;

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
        paused: "paused",
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
    <div className="space-y-4">
      {showBulkDelete && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Trash2 className="h-3.5 w-3.5" />}
            onClick={() => {
              const ids = completableItems.map((r) => r.id);
              if (ids.length) bulkDeleteMutation.mutate(ids);
            }}
            isLoading={bulkDeleteMutation.isPending}
          >
            Clear all completed & failed
          </Button>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.items.map((reminder, index) => (
          <ReminderCard key={reminder.id} reminder={reminder} index={index} />
        ))}
      </div>
    </div>
  );
}
