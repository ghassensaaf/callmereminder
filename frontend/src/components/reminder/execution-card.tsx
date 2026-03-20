"use client";

import { useState, type ReactNode } from "react";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Clock,
  AlertCircle,
  Phone,
  ExternalLink,
  RefreshCw,
  Mic,
  Copy,
  Check,
  MessageSquare,
  FileText,
} from "lucide-react";
import { motion } from "framer-motion";

import { Card, Badge, Button, Modal } from "@/components/ui";
import { formatDateTime, formatRelativeTime, cn } from "@/lib/utils";
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

function MetaChip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium",
        "bg-surface-100 dark:bg-surface-800/90 text-surface-700 dark:text-surface-200",
        "border border-surface-200/80 dark:border-surface-600/50",
        className
      )}
    >
      {children}
    </span>
  );
}

function CallDetailsDialogBody({
  execution,
  details,
  callId,
  onRefresh,
  isRefreshing,
  syncError,
}: {
  execution: ReminderExecution;
  details: CallLogDetails | null | undefined;
  callId: string | null | undefined;
  onRefresh: () => void;
  isRefreshing: boolean;
  syncError: unknown;
}) {
  const [copied, setCopied] = useState(false);
  const durationLabel = formatDuration(details?.durationSeconds ?? undefined);
  const chatMessages = details?.messages?.filter((m) => messageLine(m)) ?? [];
  const hasContent =
    !!details &&
    (details.summary?.trim() ||
      details.transcript?.trim() ||
      chatMessages.length > 0 ||
      details.recordingUrl ||
      details.stereoRecordingUrl ||
      details.endedReason != null);

  async function copyCallId() {
    if (!callId) return;
    try {
      await navigator.clipboard.writeText(callId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 -mt-1">
        <div className="flex flex-wrap gap-2">
          {durationLabel != null && <MetaChip>Duration · {durationLabel}</MetaChip>}
          {details?.endedReason && (
            <MetaChip className="capitalize">Ended · {String(details.endedReason).replace(/-/g, " ")}</MetaChip>
          )}
          {details?.cost != null && (
            <MetaChip>Cost · {typeof details.cost === "number" ? details.cost.toFixed(4) : details.cost}</MetaChip>
          )}
          {details?.enrichedAt && (
            <MetaChip className="text-surface-500 dark:text-surface-400 font-normal border-0 bg-transparent">
              Updated {formatRelativeTime(details.enrichedAt)}
            </MetaChip>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isRefreshing}
          leftIcon={<RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />}
          onClick={onRefresh}
          className="self-start sm:self-auto"
        >
          {hasContent ? "Refresh from Vapi" : "Load from Vapi"}
        </Button>
      </div>

      {axios.isAxiosError(syncError) && syncError.response?.data?.detail && (
        <div className="rounded-xl border border-danger-200 dark:border-danger-800/60 bg-danger-50/80 dark:bg-danger-950/35 px-3 py-2.5 text-sm text-danger-800 dark:text-danger-200">
          {String(syncError.response.data.detail)}
        </div>
      )}

      {!hasContent ? (
        <div className="rounded-2xl border border-dashed border-surface-300 dark:border-surface-600 bg-surface-50/80 dark:bg-surface-800/40 px-5 py-10 text-center">
          <Mic className="h-10 w-10 mx-auto text-surface-400 dark:text-surface-500 mb-3 opacity-90" />
          <p className="text-sm font-medium text-surface-800 dark:text-surface-100">No call log yet</p>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-2 max-w-md mx-auto leading-relaxed">
            When Vapi sends an end-of-call report to your server, the transcript appears here automatically. You can also
            pull it from Vapi after the call finishes.
          </p>
          <Button type="button" className="mt-5" size="sm" disabled={isRefreshing} onClick={onRefresh}>
            Load from Vapi
          </Button>
        </div>
      ) : (
        <>
          {details?.summary?.trim() && (
            <div className="rounded-2xl bg-primary-500/6 dark:bg-primary-400/8 border border-primary-200/40 dark:border-primary-800/40 px-4 py-3.5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary-700 dark:text-primary-300 mb-2">
                <FileText className="h-3.5 w-3.5" />
                Summary
              </div>
              <p className="text-sm text-surface-800 dark:text-surface-100 leading-relaxed">{details.summary.trim()}</p>
            </div>
          )}

          {chatMessages.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-3">
                <MessageSquare className="h-3.5 w-3.5" />
                Conversation
              </div>
              <div
                className="max-h-[min(50vh,420px)] overflow-y-auto overscroll-contain rounded-2xl border border-surface-200/80 dark:border-surface-700/80 bg-surface-50/50 dark:bg-surface-950/30 px-3 py-4 space-y-3"
                role="log"
                aria-label="Call transcript"
              >
                {chatMessages.map((m, i) => {
                  const role = (m.role || "unknown").toLowerCase();
                  const isUser = role === "user" || role === "customer";
                  const line = messageLine(m);
                  return (
                    <div
                      key={i}
                      className={cn("flex", isUser ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "max-w-[92%] sm:max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm",
                          isUser
                            ? "bg-primary-600 text-white dark:bg-primary-500 rounded-br-md"
                            : "bg-white dark:bg-surface-800 text-surface-800 dark:text-surface-100 border border-surface-200/90 dark:border-surface-600/60 rounded-bl-md"
                        )}
                      >
                        <span
                          className={cn(
                            "text-[10px] font-semibold uppercase tracking-wider block mb-1",
                            isUser ? "text-primary-100/90" : "text-surface-500 dark:text-surface-400"
                          )}
                        >
                          {isUser ? "You" : "Assistant"}
                        </span>
                        {line}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {details?.transcript?.trim() && chatMessages.length === 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-2">
                Transcript
              </div>
              <pre className="text-sm whitespace-pre-wrap break-words rounded-2xl border border-surface-200/80 dark:border-surface-700/80 bg-white dark:bg-surface-900/60 px-4 py-3 max-h-[min(40vh,320px)] overflow-y-auto text-surface-800 dark:text-surface-200 leading-relaxed">
                {details.transcript.trim()}
              </pre>
            </div>
          )}

          {(details?.recordingUrl || details?.stereoRecordingUrl) && (
            <div className="flex flex-col sm:flex-row flex-wrap gap-2">
              {details.recordingUrl && (
                <a
                  href={details.recordingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium",
                    "bg-surface-900 text-white dark:bg-surface-100 dark:text-surface-900",
                    "hover:opacity-90 transition-opacity"
                  )}
                >
                  <ExternalLink className="h-4 w-4" />
                  Open recording
                </a>
              )}
              {details.stereoRecordingUrl && (
                <a
                  href={details.stereoRecordingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-surface-300 dark:border-surface-600 px-4 py-2.5 text-sm font-medium text-surface-800 dark:text-surface-100 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Stereo recording
                </a>
              )}
            </div>
          )}
        </>
      )}

      {callId && (
        <div className="pt-2 border-t border-surface-200/80 dark:border-surface-700/80">
          <p className="text-[11px] font-medium text-surface-500 dark:text-surface-400 mb-1.5">Vapi call ID</p>
          <div className="flex items-center gap-2 rounded-xl bg-surface-100 dark:bg-surface-800/80 pl-3 pr-1 py-1 border border-surface-200/60 dark:border-surface-600/50">
            <code className="text-xs font-mono text-surface-700 dark:text-surface-300 truncate flex-1" title={callId}>
              {callId}
            </code>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="flex-shrink-0"
              onClick={() => void copyCallId()}
              aria-label="Copy call ID"
            >
              {copied ? <Check className="h-4 w-4 text-success-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}

      <p className="text-xs text-surface-400 dark:text-surface-500">
        Reminder: {execution.reminder_title ?? "—"} · Ran {formatRelativeTime(execution.executed_at)}
      </p>
    </div>
  );
}

export function ExecutionCard({ execution, index = 0 }: ExecutionCardProps) {
  const isCompleted = execution.status === "completed";
  const [detailsOpen, setDetailsOpen] = useState(false);
  const queryClient = useQueryClient();

  const details = execution.call_details;
  const logAvailable = hasRenderableLog(details);
  const canSync = !!execution.call_id?.trim();

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
      setDetailsOpen(true);
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
                variant={logAvailable ? "primary" : "outline"}
                size="sm"
                leftIcon={<Phone className="h-3.5 w-3.5" />}
                onClick={() => setDetailsOpen(true)}
              >
                {logAvailable ? "View call details" : "Call details"}
              </Button>
              <span className="text-xs text-surface-500 dark:text-surface-400">
                {logAvailable ? "Transcript/recording available" : "No transcript loaded yet"}
              </span>
              {!logAvailable && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-surface-600 dark:text-surface-300"
                  disabled={syncMutation.isPending}
                  leftIcon={<RefreshCw className={cn("h-3.5 w-3.5", syncMutation.isPending && "animate-spin")} />}
                  onClick={() => syncMutation.mutate()}
                >
                  Load from Vapi
                </Button>
              )}
            </div>
          )}

          {syncMutation.isError && !detailsOpen && (
            <p className="mt-2 text-xs text-danger-600 dark:text-danger-400">
              {axios.isAxiosError(syncMutation.error) && syncMutation.error.response?.data?.detail
                ? String(syncMutation.error.response.data.detail)
                : "Could not load call details."}
            </p>
          )}
        </div>
      </Card>

      <Modal
        isOpen={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        title="Call details"
        description={`${execution.reminder_title ?? "Reminder"} · ${formatDateTime(execution.executed_at)}`}
        size="xl"
      >
        <CallDetailsDialogBody
          execution={execution}
          details={details}
          callId={execution.call_id}
          onRefresh={() => syncMutation.mutate()}
          isRefreshing={syncMutation.isPending}
          syncError={syncMutation.isError ? syncMutation.error : null}
        />
      </Modal>
    </motion.div>
  );
}
