"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { KeyRound, Plus, RefreshCw, BarChart3, ShieldAlert, Code2, Copy, Eye } from "lucide-react";

import { Button, Card, Input, Badge } from "@/components/ui";
import { publicApiKeysApi, settingsApi } from "@/lib/api";

function formatDate(value: string | null) {
  if (!value) return "Never";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "Invalid date";
  return d.toLocaleString();
}

function formatMs(value: number) {
  if (!Number.isFinite(value)) return "0 ms";
  if (value < 1000) return `${Math.round(value)} ms`;
  return `${(value / 1000).toFixed(2)} s`;
}

export function PublicApiSection() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [days, setDays] = useState(7);
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: () => settingsApi.get(),
  });
  const canManage = settings?.organizationRole === "owner" || settings?.organizationRole === "admin";

  const { data: keysData, isLoading: keysLoading, refetch: refetchKeys } = useQuery({
    queryKey: ["public-api-keys"],
    queryFn: () => publicApiKeysApi.list(),
    enabled: !!canManage,
  });

  const { data: overviewMetrics, isLoading: overviewLoading } = useQuery({
    queryKey: ["public-api-metrics-overview", days],
    queryFn: () => publicApiKeysApi.metricsOverview(days),
    enabled: !!canManage,
  });

  const { data: keyMetrics, isLoading: keyMetricsLoading } = useQuery({
    queryKey: ["public-api-metrics-key", selectedKeyId, days],
    queryFn: () => publicApiKeysApi.metricsForKey(selectedKeyId as string, days),
    enabled: !!canManage && !!selectedKeyId,
  });

  const activeMetrics = selectedKeyId ? keyMetrics : overviewMetrics;

  const maxSeriesValue = useMemo(() => {
    const arr = activeMetrics?.timeseries ?? [];
    return arr.reduce((max, item) => Math.max(max, item.request_count), 0) || 1;
  }, [activeMetrics]);

  async function refreshAll() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["public-api-keys"] }),
      queryClient.invalidateQueries({ queryKey: ["public-api-metrics-overview"] }),
      queryClient.invalidateQueries({ queryKey: ["public-api-metrics-key"] }),
    ]);
  }

  async function handleCreateKey() {
    const safeName = name.trim();
    if (!safeName) {
      toast.error("Key name is required");
      return;
    }

    try {
      const payload: { name: string; expires_at?: string } = { name: safeName };
      if (expiresAt) {
        const iso = new Date(expiresAt).toISOString();
        payload.expires_at = iso;
      }
      const created = await publicApiKeysApi.create(payload);
      setNewKey(created.api_key);
      setCreateOpen(false);
      setName("");
      setExpiresAt("");
      toast.success("API key created");
      await refreshAll();
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.detail || "Failed to create key" : "Failed to create key";
      toast.error(message);
    }
  }

  async function handleRevokeKey(id: string) {
    if (!confirm("Revoke this API key? This cannot be undone.")) return;
    try {
      await publicApiKeysApi.revoke(id);
      if (selectedKeyId === id) setSelectedKeyId(null);
      toast.success("API key revoked");
      await refreshAll();
    } catch {
      toast.error("Failed to revoke key");
    }
  }

  async function copyNewKey() {
    if (!newKey) return;
    try {
      await navigator.clipboard.writeText(newKey);
      toast.success("Copied");
    } catch {
      toast.error("Failed to copy");
    }
  }

  return (
    <Card variant="elevated" className="p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold text-surface-900 dark:text-surface-50 flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            Public API
          </h2>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1 max-w-2xl">
            Create and rotate API keys for server-to-server integrations. Usage telemetry includes latency, endpoint
            distribution, error breakdowns, and key-level trends.
          </p>
          {!canManage && (
            <p className="text-sm text-surface-600 dark:text-surface-300 mt-2">
              You can view API docs. Ask an owner/admin to create or revoke keys.
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/docs/api">
            <Button type="button" variant="outline" size="sm" leftIcon={<Code2 className="h-4 w-4" />}>
              Dev docs
            </Button>
          </Link>
          <Button type="button" variant="ghost" size="sm" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={refreshAll}>
            Refresh
          </Button>
        </div>
      </div>

      {newKey && (
        <div className="rounded-xl border border-success-200 dark:border-success-900/60 bg-success-50/70 dark:bg-success-950/25 p-4 space-y-2">
          <p className="text-sm font-medium text-success-800 dark:text-success-200">Copy this key now (shown once)</p>
          <p className="text-xs text-success-700 dark:text-success-300">
            Store it in your secret manager. You cannot retrieve the full key again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-lg bg-white/80 dark:bg-surface-900/70 px-3 py-2 text-xs overflow-x-auto">
              {newKey}
            </code>
            <Button type="button" size="sm" onClick={copyNewKey} leftIcon={<Copy className="h-3.5 w-3.5" />}>
              Copy
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setNewKey(null)}>
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {canManage && (
        <div className="rounded-xl border border-surface-200 dark:border-surface-700 p-4">
          {!createOpen ? (
            <Button type="button" size="sm" variant="outline" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setCreateOpen(true)}>
              Create API key
            </Button>
          ) : (
            <div className="space-y-3">
              <Input label="Key name" placeholder="Production backend" value={name} onChange={(e) => setName(e.target.value)} />
              <Input
                label="Expiration (optional)"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                hint="Leave empty for non-expiring key."
              />
              <div className="flex gap-2">
                <Button type="button" size="sm" onClick={handleCreateKey}>
                  Create
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-surface-900 dark:text-surface-100">API keys</p>
          <Badge variant="info" size="sm">{keysData?.items.length ?? 0} keys</Badge>
        </div>
        {keysLoading ? (
          <p className="text-sm text-surface-500">Loading keys...</p>
        ) : (
          <div className="space-y-2">
            {(keysData?.items ?? []).map((item) => {
              const isRevoked = !!item.revoked_at;
              const isSelected = selectedKeyId === item.id;
              return (
                <div key={item.id} className="rounded-lg border border-surface-200 dark:border-surface-700 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-surface-900 dark:text-surface-50">{item.name}</p>
                      <p className="text-xs text-surface-500 dark:text-surface-400 font-mono">{item.key_prefix}...</p>
                      <p className="text-xs text-surface-500 dark:text-surface-400">
                        Last used: {formatDate(item.last_used_at)} | Expires: {formatDate(item.expires_at)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {isRevoked ? (
                        <Badge variant="danger" size="sm">Revoked</Badge>
                      ) : (
                        <Badge variant="success" size="sm">Active</Badge>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant={isSelected ? "primary" : "outline"}
                        leftIcon={<Eye className="h-3.5 w-3.5" />}
                        onClick={() => setSelectedKeyId(isSelected ? null : item.id)}
                      >
                        {isSelected ? "Viewing" : "View metrics"}
                      </Button>
                      {!isRevoked && canManage && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="text-danger-600 dark:text-danger-400"
                          leftIcon={<ShieldAlert className="h-3.5 w-3.5" />}
                          onClick={() => handleRevokeKey(item.id)}
                        >
                          Revoke
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {(keysData?.items.length ?? 0) === 0 && <p className="text-sm text-surface-500">No API keys yet.</p>}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-surface-200 dark:border-surface-700 p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Usage metrics {selectedKeyId ? "(selected key)" : "(organization)"}
          </h3>
          <div className="flex gap-1 rounded-lg border border-surface-200 dark:border-surface-700 p-1">
            {[1, 7, 30].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setDays(option)}
                className={`px-2.5 py-1 text-xs rounded-md transition ${
                  days === option
                    ? "bg-primary-600 text-white"
                    : "text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800"
                }`}
              >
                {option}d
              </button>
            ))}
          </div>
        </div>

        {overviewLoading || keyMetricsLoading ? (
          <p className="text-sm text-surface-500">Loading metrics...</p>
        ) : !activeMetrics ? (
          <p className="text-sm text-surface-500">No metrics yet.</p>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-lg bg-surface-50 dark:bg-surface-900/40 p-3">
                <p className="text-xs text-surface-500">Requests</p>
                <p className="text-lg font-semibold">{activeMetrics.totals.total_requests}</p>
              </div>
              <div className="rounded-lg bg-surface-50 dark:bg-surface-900/40 p-3">
                <p className="text-xs text-surface-500">Success rate</p>
                <p className="text-lg font-semibold">{activeMetrics.totals.success_rate}%</p>
              </div>
              <div className="rounded-lg bg-surface-50 dark:bg-surface-900/40 p-3">
                <p className="text-xs text-surface-500">P50 latency</p>
                <p className="text-lg font-semibold">{formatMs(activeMetrics.totals.p50_duration_ms)}</p>
              </div>
              <div className="rounded-lg bg-surface-50 dark:bg-surface-900/40 p-3">
                <p className="text-xs text-surface-500">P95 latency</p>
                <p className="text-lg font-semibold">{formatMs(activeMetrics.totals.p95_duration_ms)}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-surface-500 mb-2">Request trend</p>
              <div className="flex items-end gap-1 h-28 rounded-lg border border-surface-200 dark:border-surface-700 p-2">
                {activeMetrics.timeseries.length === 0 ? (
                  <p className="text-xs text-surface-500">No data in selected window.</p>
                ) : (
                  activeMetrics.timeseries.map((point) => {
                    const h = Math.max(8, Math.round((point.request_count / maxSeriesValue) * 100));
                    return (
                      <div
                        key={point.bucket_start}
                        className="flex-1 min-w-[6px] rounded-sm bg-primary-500/80 hover:bg-primary-500 transition"
                        style={{ height: `${h}%` }}
                        title={`${new Date(point.bucket_start).toLocaleString()}: ${point.request_count} req, ${point.error_count} errors`}
                      />
                    );
                  })
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-surface-500">Top endpoints</p>
                <div className="space-y-2">
                  {activeMetrics.top_endpoints.map((endpoint) => (
                    <div key={`${endpoint.method}-${endpoint.path}`} className="rounded-lg bg-surface-50 dark:bg-surface-900/40 px-3 py-2 text-xs">
                      <p className="font-medium text-surface-900 dark:text-surface-100">
                        {endpoint.method} {endpoint.path}
                      </p>
                      <p className="text-surface-500 dark:text-surface-400">
                        {endpoint.request_count} req | {endpoint.error_rate}% errors | P95 {formatMs(endpoint.p95_duration_ms)}
                      </p>
                    </div>
                  ))}
                  {activeMetrics.top_endpoints.length === 0 && <p className="text-xs text-surface-500">No endpoint data.</p>}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-surface-500">Status & errors</p>
                <div className="space-y-2">
                  {activeMetrics.by_status_code.map((status) => (
                    <div key={status.status_code} className="text-xs">
                      <div className="flex justify-between mb-1">
                        <span className="font-medium">{status.status_code}</span>
                        <span className="text-surface-500">{status.request_count} ({status.percentage}%)</span>
                      </div>
                      <div className="h-1.5 rounded bg-surface-200 dark:bg-surface-700">
                        <div className="h-1.5 rounded bg-cyan-500" style={{ width: `${Math.min(100, status.percentage)}%` }} />
                      </div>
                    </div>
                  ))}
                  {activeMetrics.by_status_code.length === 0 && <p className="text-xs text-surface-500">No status data.</p>}
                </div>
                {activeMetrics.error_codes.length > 0 && (
                  <div className="pt-2 border-t border-surface-200 dark:border-surface-700">
                    <p className="text-xs text-surface-500 mb-1">Top error codes</p>
                    <div className="flex flex-wrap gap-1.5">
                      {activeMetrics.error_codes.map((err) => (
                        <Badge key={err.code} size="sm" variant="warning">
                          {err.code}: {err.request_count}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="text-xs text-surface-500 dark:text-surface-400">
        Tip: Use separate keys per environment (dev/staging/prod) for cleaner metrics and safer key rotation.
      </div>
    </Card>
  );
}
