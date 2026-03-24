"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Code2, KeyRound, AlertTriangle, BarChart3, ArrowLeft } from "lucide-react";

import { Header } from "@/components/layout";
import { Card, Input, Badge } from "@/components/ui";

type DocEntry = {
  id: string;
  title: string;
  category: "endpoint" | "guide" | "example";
  tags: string[];
  content: string;
  snippet?: string;
};

const DOCS: DocEntry[] = [
  {
    id: "auth",
    title: "Authentication with Bearer API keys",
    category: "guide",
    tags: ["auth", "bearer", "apikey", "security"],
    content: "Send Authorization: Bearer <api_key> on every request. Keys are managed in Settings > API.",
    snippet: "Authorization: Bearer dc_live_xxx",
  },
  {
    id: "errors",
    title: "Error model and retry strategy",
    category: "guide",
    tags: ["errors", "retries", "validation", "status"],
    content:
      "Errors use { error: { code, message, details } }. Retry internal_error with backoff. Do not retry invalid_api_key, api_key_expired, api_key_revoked.",
  },
  {
    id: "get-me",
    title: "GET /api/public/v1/me",
    category: "endpoint",
    tags: ["identity", "whoami", "user", "organization"],
    content: "Returns user identity, organization id, and API key id for the current Bearer key.",
  },
  {
    id: "list-reminders",
    title: "GET /api/public/v1/reminders",
    category: "endpoint",
    tags: ["list", "reminders", "pagination", "filters"],
    content:
      "List reminders with filters: status, search, date_from, date_to, sort, page, page_size. Sort supports scheduled_at_asc, scheduled_at_desc, updated_at_desc.",
  },
  {
    id: "create-reminder",
    title: "POST /api/public/v1/reminders",
    category: "endpoint",
    tags: ["create", "reminder", "schedule", "recurrence"],
    content:
      "Create a reminder with title, message, phone_number (E.164), scheduled_at, timezone, and optional recurrence fields.",
    snippet:
      '{ "title":"Take medication", "message":"Please take your medication", "phone_number":"+14155552671", "scheduled_at":"2026-03-25T09:00:00", "timezone":"America/New_York" }',
  },
  {
    id: "get-reminder",
    title: "GET /api/public/v1/reminders/:id",
    category: "endpoint",
    tags: ["read", "reminder", "single"],
    content: "Fetch one reminder by id.",
  },
  {
    id: "update-reminder",
    title: "PATCH /api/public/v1/reminders/:id",
    category: "endpoint",
    tags: ["update", "edit", "pause", "resume"],
    content:
      "Update editable reminders (scheduled/paused/failed). Supports rescheduling, changing content, line selection, and recurrence settings.",
  },
  {
    id: "delete-reminder",
    title: "DELETE /api/public/v1/reminders/:id",
    category: "endpoint",
    tags: ["delete", "cleanup", "reminder"],
    content: "Delete a reminder by id.",
  },
  {
    id: "executions",
    title: "GET /api/public/v1/executions",
    category: "endpoint",
    tags: ["history", "executions", "calls", "logs"],
    content: "List execution history with pagination and optional date range filters.",
  },
  {
    id: "js-example",
    title: "JavaScript example (fetch)",
    category: "example",
    tags: ["javascript", "node", "fetch"],
    content: "Minimal JS integration with native fetch and Bearer auth.",
    snippet:
      "await fetch('https://api.yourapp.com/api/public/v1/reminders', { method: 'POST', headers: { Authorization: `Bearer ${process.env.DIALCUES_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });",
  },
  {
    id: "python-example",
    title: "Python example (requests)",
    category: "example",
    tags: ["python", "requests"],
    content: "Minimal Python integration with requests and timeout.",
    snippet:
      "requests.post(f'{base}/reminders', json=payload, headers={'Authorization': f\"Bearer {os.environ['DIALCUES_API_KEY']}\"}, timeout=20)",
  },
  {
    id: "go-example",
    title: "Go example (net/http)",
    category: "example",
    tags: ["go", "http"],
    content: "Go integration using net/http and JSON payload.",
  },
];

function computeScore(entry: DocEntry, tokens: string[]) {
  if (tokens.length === 0) return 1;
  const haystackTitle = entry.title.toLowerCase();
  const haystackContent = `${entry.content} ${entry.tags.join(" ")}`.toLowerCase();
  return tokens.reduce((score, token) => {
    if (haystackTitle.includes(token)) return score + 8;
    if (entry.tags.some((t) => t.includes(token))) return score + 5;
    if (haystackContent.includes(token)) return score + 2;
    return score;
  }, 0);
}

function highlight(text: string, query: string) {
  const q = query.trim();
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-primary-100 dark:bg-primary-900/50 text-primary-800 dark:text-primary-200 rounded px-0.5">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}

export default function ApiDocsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | DocEntry["category"]>("all");

  const tokens = useMemo(() => query.toLowerCase().split(/\s+/).filter(Boolean), [query]);
  const filtered = useMemo(() => {
    return DOCS.map((entry) => ({ entry, score: computeScore(entry, tokens) }))
      .filter((item) => item.score > 0)
      .filter((item) => (category === "all" ? true : item.entry.category === category))
      .sort((a, b) => b.score - a.score);
  }, [tokens, category]);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to settings
        </Link>

        <Card variant="elevated" className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-display font-bold text-surface-900 dark:text-surface-50 flex items-center gap-2">
                <Code2 className="h-6 w-6 text-primary-500" />
                Developer API docs
              </h1>
              <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                Search endpoints, auth details, examples, and integration patterns.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="https://swagger.io/specification/" target="_blank">
                <Badge variant="info">OpenAPI-first</Badge>
              </Link>
              <Badge variant="primary">REST v1</Badge>
            </div>
          </div>

          <Input
            placeholder="Search (e.g. create reminder, errors, python, latency)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />

          <div className="flex flex-wrap gap-2">
            {[
              ["all", "All"],
              ["endpoint", "Endpoints"],
              ["guide", "Guides"],
              ["example", "Examples"],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setCategory(id as "all" | DocEntry["category"])}
                className={`px-3 py-1.5 text-xs rounded-lg border transition ${
                  category === id
                    ? "bg-primary-600 text-white border-primary-600"
                    : "border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </Card>

        <div className="grid md:grid-cols-3 gap-3">
          <Card className="p-4">
            <p className="text-xs text-surface-500 uppercase tracking-wide">Auth</p>
            <p className="mt-1 text-sm font-medium flex items-center gap-1.5"><KeyRound className="h-4 w-4" /> Bearer API keys</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-surface-500 uppercase tracking-wide">Errors</p>
            <p className="mt-1 text-sm font-medium flex items-center gap-1.5"><AlertTriangle className="h-4 w-4" /> Stable error codes</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-surface-500 uppercase tracking-wide">Metrics</p>
            <p className="mt-1 text-sm font-medium flex items-center gap-1.5"><BarChart3 className="h-4 w-4" /> Key-level analytics</p>
          </Card>
        </div>

        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Search results</p>
            <Badge variant="info">{filtered.length}</Badge>
          </div>

          {filtered.length === 0 && (
            <p className="text-sm text-surface-500">No matches. Try terms like "recurrence", "executions", "python", or "auth".</p>
          )}

          <div className="space-y-3">
            {filtered.map(({ entry }) => (
              <article key={entry.id} className="rounded-xl border border-surface-200 dark:border-surface-700 p-4 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm font-semibold text-surface-900 dark:text-surface-50">{highlight(entry.title, query)}</h2>
                  <Badge size="sm" variant={entry.category === "endpoint" ? "primary" : entry.category === "guide" ? "info" : "success"}>
                    {entry.category}
                  </Badge>
                </div>
                <p className="text-sm text-surface-600 dark:text-surface-300">{highlight(entry.content, query)}</p>
                {entry.snippet && (
                  <pre className="text-xs rounded-lg bg-surface-100 dark:bg-surface-900 p-3 overflow-x-auto">
                    <code>{entry.snippet}</code>
                  </pre>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {entry.tags.map((tag) => (
                    <Badge key={tag} variant="outline" size="sm">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </Card>

        <p className="text-xs text-surface-500 dark:text-surface-400">
          Full markdown and OpenAPI files remain in <code>docs/public-api.md</code> and <code>docs/public-api.openapi.yaml</code>.
        </p>
      </main>
    </div>
  );
}
