"use client";

import { useState } from "react";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Phone,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";

import { Card, Badge, Button } from "@/components/ui";
import { formatDateTime, formatRelativeTime } from "@/lib/utils";
import { remindersApi } from "@/lib/api";
import { CallLogDetails, ReminderExecution } from "@/types/reminder";

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

function formatDuration(seconds: number | null | undefined): string | null {
  if (seconds == null || Number.isNaN(seconds)) return null;
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}m ${r}s` : `${r}s`;
}

function messageLine(m: NonNullable<CallLogDetails["messages"]>[number]): string {
  const text = m.message ?? m.content;
  if (typeof text === "string" && text.trim()) return text;
  return "";
}

function hasRenderableLog(details: CallLogDetails | null | undefined): boolean {
  if (!details) return false;
  if (details.summary?.trim()) return true;
  if (details.transcript?.trim()) return true;
  if (details.messages?.some((m) => messageLine(m))) return true;
  if (details.recordingUrl || details.stereoRecordingUrl) return true;
  if (details.endedReason) return true;
  return false;
}

function CallLogPanel({
  details,
  callId,
}: {
  details: CallLogDetails;
  callId: string | null | undefined;
}) {
  const durationLabel = formatDuration(details.durationSeconds ?? undefined);
  const chatMessages =
    details.messages?.filter((m) => messageLine(m)) ?? [];

  return (
    <div className="mt-4 space-y-3 border-t border-surface-200/80 dark:border-surface-700/80 pt-4">
      {(details.endedReason || durationLabel != null || details.cost != null) && (
        <div className="flex flex-wrap gap-2 text-xs text-surface-500 dark:text-surface-400">
          {details.endedReason && (
            <span className="rounded-md bg-surface-100 dark:bg-surface-800 px-2 py-0.5">
              Ended: {details.endedReason}
            </span>
          )}
          {durationLabel != null && (
            <span className="rounded-md bg-surface-100 dark:bg-surface-800 px-2 py-0.5">
              Duration: {durationLabel}
            </span>
          )}
          {details.cost != null && (
            <span className="rounded-md bg-surface-100 dark:bg-surface-800 px-2 py-0.5">
              Cost: {typeof details.cost === "number" ? details.cost.toFixed(4) : details.cost}
            </span>
          )}
        </div>
      )}

      {details.summary?.trim() && (
        <div>
          <p className="text-xs font-medium text-surface-500 dark:text-surface-400 mb-1">Summary</p>
          <p className="text-sm text-surface-800 dark:text-surface-200 leading-relaxed">{details.summary.trim()}</p>
        </div>
      )}

      {chatMessages.length > 0 && (
        <div>
          <p className="text-xs font-medium text-surface-500 dark:text-surface-400 mb-2">Conversation</p>
          <ul className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {chatMessages.map((m, i) => {
              const role = (m.role || "unknown").toLowerCase();
              const isUser = role === "user" || role === "customer";
              const line = messageLine(m);
              return (
                <li
                  key={i}
                  className={`text-sm rounded-lg px-3 py-2 ${
                    isUser
                      ? "bg-primary-500/10 text-surface-800 dark:text-surface-100 ml-4"
                      : "bg-surface-100 dark:bg-surface-800/80 text-surface-800 dark:text-surface-100 mr-4"
                  }`}
                >
                  <span className="text-[10px] uppercase tracking-wide opacity-70 block mb-0.5">
                    {isUser ? "You" : "Assistant"}
                  </span>
                  {line}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {details.transcript?.trim() && chatMessages.length === 0 && (
        <div>
          <p className="text-xs font-medium text-surface-500 dark:text-surface-400 mb-1">Transcript</p>
          <pre className="text-xs whitespace-pre-wrap break-words bg-surface-50 dark:bg-surface-900/50 rounded-lg p-3 border border-surface-200/60 dark:border-surface-700/60 max-h-48 overflow-y-auto text-surface-800 dark:text-surface-200">
            {details.transcript.trim()}
          </pre>
        </div>
      )}

      {(details.recordingUrl || details.stereoRecordingUrl) && (
        <div className="flex flex-wrap gap-2">
          {details.recordingUrl && (
            <a
              href={details.recordingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Recording
            </a>
          )}
          {details.stereoRecordingUrl && (
            <a
              href={details.stereoRecordingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Stereo
            </a>
          )}
        </div>
      )}

      {callId && (
        <p className="text-[10px] text-surface-400 dark:text-surface-500 font-mono truncate" title={callId}>
          Call ID: {callId}
        </p>
      )}
    </div>
  );
}

export function ExecutionCard({ execution, index = 0 }: ExecutionCardProps) {
  const isCompleted = execution.status === "completed";
  const [logOpen, setLogOpen] = useState(false);
  const queryClient = useQueryClient();

  const details = execution.call_details;
  const logAvailable = hasRenderableLog(details);
  const canSync =
    isCompleted && !!execution.call_id?.trim();

  const syncMutation = useMutation({
    mutationFn: () => remindersApi.syncExecutionCallLog(execution.id),
    onSuccess: (updated) => {
      queryClient.setQueriesData(
        { queryKey: ["executions"] },
        (old: unknown) => {
          if (!old || typeof old !== "object" || !("items" in old)) return old;
          const data = old as { items: ReminderExecution[] };
          return {
            ...data,
            items: data.items.map((row) => (row.id === updated.id ? updated : row)),
          };
        }
      );
      if (hasRenderableLog(updated.call_details)) setLogOpen(true);
    },
  });

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
            <Badge variant={isCompleted ? "success" : "danger"} size="sm" dot>
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

          {canSync && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-surface-600 dark:text-surface-300 -ml-2"
                leftIcon={<Phone className="h-3.5 w-3.5" />}
                rightIcon={
                  logOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
                }
                onClick={() => setLogOpen((o) => !o)}
              >
                {logOpen ? "Hide call log" : "Call log"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={syncMutation.isPending}
                leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${syncMutation.isPending ? "animate-spin" : ""}`} />}
                onClick={() => syncMutation.mutate()}
              >
                {logAvailable ? "Refresh from Vapi" : "Load from Vapi"}
              </Button>
            </div>
          )}

          {syncMutation.isError && (
            <p className="mt-2 text-xs text-danger-600 dark:text-danger-400">
              {axios.isAxiosError(syncMutation.error) && syncMutation.error.response?.data?.detail
                ? String(syncMutation.error.response.data.detail)
                : "Could not load call details."}
            </p>
          )}

          {logOpen && canSync && (
            <>
              {details && hasRenderableLog(details) ? (
                <CallLogPanel details={details} callId={execution.call_id} />
              ) : (
                <p className="mt-3 text-sm text-surface-500 dark:text-surface-400">
                  No transcript loaded yet. Set <code className="text-xs">API_PUBLIC_URL</code> so Vapi can send the
                  end-of-call report, or use &quot;Load from Vapi&quot; once the call has finished.
                </p>
              )}
            </>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
