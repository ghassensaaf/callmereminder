"use client";

import { Calendar, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

import { Card, Badge } from "@/components/ui";
import { formatDateTime, formatRelativeTime } from "@/lib/utils";
import { ReminderExecution } from "@/types/reminder";

interface ExecutionCardProps {
  execution: ReminderExecution;
  index?: number;
}

function formatErrorMessage(errorMessage: string): string {
  if (!errorMessage) return "Unknown error";
  try {
    const jsonMatch = errorMessage.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.message || parsed.error || errorMessage;
    }
  } catch {}
  return errorMessage.length > 100 ? errorMessage.substring(0, 100) + "..." : errorMessage;
}

export function ExecutionCard({ execution, index = 0 }: ExecutionCardProps) {
  const isCompleted = execution.status === "completed";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card
        variant="default"
        padding="none"
        className={
          execution.status === "failed"
            ? "border-danger-200/50 dark:border-danger-500/30"
            : ""
        }
      >
        <div className="p-5">
          <div className="flex items-start justify-between gap-4 mb-3">
            <h3 className="font-semibold text-surface-900 dark:text-surface-50 truncate">
              {execution.reminder_title ?? "Unknown"}
            </h3>
            <Badge
              variant={isCompleted ? "success" : "danger"}
              size="sm"
              dot
            >
              {execution.status}
            </Badge>
          </div>
          {execution.reminder_message && (
            <p className="text-sm text-surface-600 dark:text-surface-300 line-clamp-2 mb-3">
              {execution.reminder_message}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-4 text-xs text-surface-500 dark:text-surface-400">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>Scheduled: {formatDateTime(execution.scheduled_at)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>Ran {formatRelativeTime(execution.executed_at)}</span>
            </div>
          </div>
          {execution.status === "failed" && execution.error_message && (
            <div className="mt-3 p-3 bg-danger-50 dark:bg-danger-950/30 rounded-lg border border-danger-100 dark:border-danger-800/50">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-danger-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-danger-700 dark:text-danger-300">
                  {formatErrorMessage(execution.error_message)}
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
