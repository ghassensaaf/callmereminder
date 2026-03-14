"use client";

import { useQuery } from "@tanstack/react-query";
import { History, Search, AlertTriangle, Download } from "lucide-react";

import { ExecutionCard } from "./execution-card";
import { SkeletonCard, EmptyState, Button } from "@/components/ui";
import { remindersApi } from "@/lib/api";

interface ExecutionListProps {
  dateFrom?: string;
  dateTo?: string;
  onCreateClick?: () => void;
}

export function ExecutionList({
  dateFrom,
  dateTo,
  onCreateClick,
}: ExecutionListProps) {
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["executions", dateFrom, dateTo],
    queryFn: () =>
      remindersApi.listExecutions({
        page_size: 50,
        date_from: dateFrom,
        date_to: dateTo,
      }),
  });

  const handleExport = () => {
    if (!data?.items.length) return;
    const headers = ["Title", "Message", "Scheduled", "Executed", "Status", "Error"];
    const rows = data.items.map((e) => [
      e.reminder_title ?? "",
      (e.reminder_message ?? "").replace(/"/g, '""'),
      e.scheduled_at,
      e.executed_at,
      e.status,
      (e.error_message ?? "").replace(/"/g, '""'),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reminder-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
        title="Failed to load history"
        description="Something went wrong. Please try again."
        action={
          <Button onClick={() => refetch()} variant="primary">
            Try Again
          </Button>
        }
      />
    );
  }

  if (!data?.items.length) {
    return (
      <EmptyState
        icon={<History className="h-8 w-8" />}
        title="No history yet"
        description="Your reminder execution history will appear here once reminders run."
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

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Download className="h-3.5 w-3.5" />}
          onClick={handleExport}
        >
          Export CSV
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.items.map((execution, index) => (
          <ExecutionCard key={execution.id} execution={execution} index={index} />
        ))}
      </div>
    </div>
  );
}
