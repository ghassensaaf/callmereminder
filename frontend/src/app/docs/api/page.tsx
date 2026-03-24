"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Search,
  Code2,
  BookOpen,
  ArrowLeft,
  Copy,
  Check,
  ChevronDown,
} from "lucide-react";

import { Header } from "@/components/layout";

type LanguageKey = "curl" | "javascript" | "python" | "php" | "go" | "ruby" | "java" | "csharp";

const LANGUAGES: { key: LanguageKey; label: string }[] = [
  { key: "curl", label: "cURL" },
  { key: "javascript", label: "Node.js" },
  { key: "python", label: "Python" },
  { key: "php", label: "PHP" },
  { key: "java", label: "Java" },
  { key: "go", label: "Go" },
  { key: "ruby", label: "Ruby" },
  { key: "csharp", label: ".NET" },
];

interface DocSection {
  id: string;
  title: string;
  group: "getting-started" | "core-resources" | "history";
  prose: React.ReactNode;
  code: Partial<Record<LanguageKey, string>>;
}

const BASE = "https://api.yourapp.com";

function mkSections(): DocSection[] {
  return [
    {
      id: "introduction",
      title: "Introduction",
      group: "getting-started",
      prose: (
        <>
          <p>
            The Dialcues API is organized around{" "}
            <span className="text-slate-900 dark:text-white font-medium">REST</span>. Our API has
            predictable resource-oriented URLs, accepts JSON-encoded request
            bodies, returns JSON-encoded responses, and uses standard HTTP
            response codes, authentication, and verbs.
          </p>
          <p className="mt-3">
            You can use the Dialcues API in test mode by generating a key from
            Settings → API. Test and production keys both use the{" "}
            <code>dc_live_</code> prefix.
          </p>
        </>
      ),
      code: {
        curl: `# Base URL
${BASE}/api/public/v1

# All requests require a Bearer token
curl ${BASE}/api/public/v1/me \\
  -H "Authorization: Bearer dc_live_xxx"`,
      },
    },
    {
      id: "authentication",
      title: "Authentication",
      group: "getting-started",
      prose: (
        <>
          <p>
            The Dialcues API uses{" "}
            <span className="text-cyan-300">API keys</span> to authenticate
            requests. You can view and manage your API keys in{" "}
            <Link
              href="/settings"
              className="text-cyan-300 hover:text-cyan-200 underline"
            >
              Settings → API
            </Link>
            .
          </p>
          <p className="mt-3">
            Your API keys carry many privileges; keep them secure. Do not share
            your secret API keys in publicly accessible areas such as GitHub,
            client-side code, and so forth.
          </p>
          <p className="mt-3">
            All API requests must include{" "}
            <code>Authorization: Bearer &lt;key&gt;</code>. Requests without
            authentication will fail with <code>401</code>.
          </p>
          <div className="mt-4 rounded-lg border border-slate-700 bg-[#0b1222] p-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-500 mb-1">
              Your API key
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              A test API key is included in all examples. Replace the sample
              key with your actual API key to test requests against your
              account.
            </p>
          </div>
        </>
      ),
      code: {
        curl: `curl ${BASE}/api/public/v1/reminders \\
  -H "Authorization: Bearer dc_live_xxxxxxxxxxxxxxxx"
  # The bearer token authenticates every request.`,
        javascript: `const res = await fetch("${BASE}/api/public/v1/reminders", {
  headers: {
    Authorization: \`Bearer \${process.env.DIALCUES_API_KEY}\`,
  },
});`,
        python: `import os, requests

res = requests.get(
    "${BASE}/api/public/v1/reminders",
    headers={"Authorization": f"Bearer {os.environ['DIALCUES_API_KEY']}"},
    timeout=20,
)`,
        php: `$ch = curl_init("${BASE}/api/public/v1/reminders");
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => [
    "Authorization: Bearer " . getenv("DIALCUES_API_KEY"),
  ],
]);
$response = curl_exec($ch);`,
        java: `HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("${BASE}/api/public/v1/reminders"))
    .header("Authorization", "Bearer " + System.getenv("DIALCUES_API_KEY"))
    .GET()
    .build();
HttpResponse<String> response =
    HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString());`,
        go: `req, _ := http.NewRequest("GET", "${BASE}/api/public/v1/reminders", nil)
req.Header.Set("Authorization", "Bearer "+os.Getenv("DIALCUES_API_KEY"))
resp, err := http.DefaultClient.Do(req)`,
        ruby: `uri = URI("${BASE}/api/public/v1/reminders")
req = Net::HTTP::Get.new(uri)
req["Authorization"] = "Bearer #{ENV.fetch("DIALCUES_API_KEY")}"
res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) { |h| h.request(req) }`,
        csharp: `var client = new HttpClient();
client.DefaultRequestHeaders.Add("Authorization",
    $"Bearer {Environment.GetEnvironmentVariable("DIALCUES_API_KEY")}");
var res = await client.GetAsync("${BASE}/api/public/v1/reminders");`,
      },
    },
    {
      id: "errors",
      title: "Errors",
      group: "getting-started",
      prose: (
        <>
          <p>
            Dialcues uses conventional HTTP response codes to indicate the
            success or failure of an API request. In general: codes in the{" "}
            <code>2xx</code> range indicate success, codes in the{" "}
            <code>4xx</code> range indicate a client error, and codes in the{" "}
            <code>5xx</code> range indicate a server error.
          </p>
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-2 pr-4">Code</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2">Meaning</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 dark:text-slate-300">
              <tr className="border-b border-slate-800">
                <td className="py-2 pr-4 font-mono text-slate-900 dark:text-white">200</td>
                <td className="py-2 pr-4">OK</td>
                <td className="py-2">Everything worked as expected.</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-2 pr-4 font-mono text-slate-900 dark:text-white">201</td>
                <td className="py-2 pr-4">Created</td>
                <td className="py-2">A new resource was successfully created.</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-2 pr-4 font-mono text-slate-900 dark:text-white">400</td>
                <td className="py-2 pr-4">Bad Request</td>
                <td className="py-2">
                  The request was unacceptable, often due to a missing
                  required parameter.
                </td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-2 pr-4 font-mono text-slate-900 dark:text-white">401</td>
                <td className="py-2 pr-4">Unauthorized</td>
                <td className="py-2">No valid API key provided.</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-2 pr-4 font-mono text-slate-900 dark:text-white">404</td>
                <td className="py-2 pr-4">Not Found</td>
                <td className="py-2">The requested resource doesn&#39;t exist.</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-mono text-slate-900 dark:text-white">500</td>
                <td className="py-2 pr-4">Server Error</td>
                <td className="py-2">Something went wrong on our end.</td>
              </tr>
            </tbody>
          </table>

          <div className="mt-5 rounded-lg border border-slate-700 bg-[#0b1222] p-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-500 mb-1">
              Error codes & messages
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              For public API endpoints, errors always return the same shape:
              <code className="ml-2">{`{ error: { code, message, details } }`}</code>.
              The <code>message</code> is human-friendly; the <code>code</code> is stable for programmatic handling.
            </p>
          </div>
        </>
      ),
      code: {
        curl: `# Error response shape
{
  "error": {
    "code": "validation_error",
    "message": "Scheduled time must be in the future.",
    "details": null
  }
}

# Common error codes:
#  unauthorized         - missing Bearer token
#  invalid_api_key      - key not found
#  api_key_revoked      - key was revoked
#  api_key_expired      - key has expired
#  validation_error     - request body validation failed
#  not_found            - resource does not exist
#  invalid_state        - reminder is not in an editable state
#  internal_error       - unexpected server error (retry OK)`,
      },
    },

    {
      id: "error-codes",
      title: "Error codes & messages",
      group: "getting-started",
      prose: (
        <>
          <p>
            This section lists the main error codes you’ll see from <code>/api/public/v1</code>.
            Use these codes for branching logic and user-facing messages.
          </p>

          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-2 pr-4">Code</th>
                <th className="pb-2 pr-4">Typical HTTP</th>
                <th className="pb-2">When it happens</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 dark:text-slate-300">
              <tr className="border-b border-slate-800">
                <td className="py-2 pr-4 font-mono text-slate-900 dark:text-white">unauthorized</td>
                <td className="py-2 pr-4">401</td>
                <td className="py-2">Missing <code>Authorization: Bearer ...</code></td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-2 pr-4 font-mono text-slate-900 dark:text-white">invalid_api_key</td>
                <td className="py-2 pr-4">401</td>
                <td className="py-2">Key not found / wrong key</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-2 pr-4 font-mono text-slate-900 dark:text-white">api_key_revoked</td>
                <td className="py-2 pr-4">401</td>
                <td className="py-2">Key was revoked in Settings → API</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-2 pr-4 font-mono text-slate-900 dark:text-white">api_key_expired</td>
                <td className="py-2 pr-4">401</td>
                <td className="py-2">Key reached its expiry time</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-2 pr-4 font-mono text-slate-900 dark:text-white">validation_error</td>
                <td className="py-2 pr-4">400</td>
                <td className="py-2">Missing required fields, invalid phone/timezone/date</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-2 pr-4 font-mono text-slate-900 dark:text-white">missing_outbound_line</td>
                <td className="py-2 pr-4">400</td>
                <td className="py-2">No Vapi outbound line configured for calling</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-2 pr-4 font-mono text-slate-900 dark:text-white">invalid_state</td>
                <td className="py-2 pr-4">400</td>
                <td className="py-2">Trying to update a reminder that can’t be edited</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-2 pr-4 font-mono text-slate-900 dark:text-white">not_found</td>
                <td className="py-2 pr-4">404</td>
                <td className="py-2">Reminder/execution doesn’t exist for this user</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-mono text-slate-900 dark:text-white">internal_error</td>
                <td className="py-2 pr-4">500</td>
                <td className="py-2">Unexpected error; retry with backoff</td>
              </tr>
            </tbody>
          </table>
        </>
      ),
      code: {
        curl: `# Example: invalid key
HTTP/1.1 401
{
  "error": {
    "code": "invalid_api_key",
    "message": "API key is invalid.",
    "details": null
  }
}

# Example: missing outbound line
HTTP/1.1 400
{
  "error": {
    "code": "missing_outbound_line",
    "message": "Add a Vapi integration with at least one phone number before creating reminders.",
    "details": null
  }
}`,
      },
    },

    {
      id: "pagination",
      title: "Pagination",
      group: "getting-started",
      prose: (
        <>
          <p>
            List endpoints return a paginated response with <code>items</code>, <code>total</code>, <code>page</code>,{" "}
            <code>page_size</code>, and <code>total_pages</code>. Use <code>page</code> and <code>page_size</code> query
            params to paginate.
          </p>
        </>
      ),
      code: {
        curl: `curl \"${BASE}/api/public/v1/reminders?page=2&page_size=20\" \\
  -H \"Authorization: Bearer dc_live_xxxxxxxxxxxxxxxx\"

# Response
{
  \"items\": [/* ... */],
  \"total\": 93,
  \"page\": 2,
  \"page_size\": 20,
  \"total_pages\": 5
}`,
      },
    },

    {
      id: "versioning",
      title: "Versioning",
      group: "getting-started",
      prose: (
        <>
          <p>
            The public API is versioned in the URL path. Current version is <code>/api/public/v1</code>. When we introduce
            breaking changes, we’ll ship a new version (e.g. <code>/v2</code>) rather than changing existing behavior.
          </p>
        </>
      ),
      code: {
        curl: `# v1 base
${BASE}/api/public/v1`,
      },
    },
    {
      id: "get-me",
      title: "Identity",
      group: "getting-started",
      prose: (
        <>
          <p className="font-mono text-cyan-300 text-sm mb-2">
            GET /api/public/v1/me
          </p>
          <p>
            Returns the authenticated user identity, organization id, and the
            API key id associated with the current Bearer token. Useful for
            verifying credentials programmatically.
          </p>
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-2 pr-4">Field</th>
                <th className="pb-2">Type</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 dark:text-slate-300">
              <tr className="border-b border-slate-800">
                <td className="py-2 pr-4 font-mono">user.id</td>
                <td className="py-2">string</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-2 pr-4 font-mono">user.email</td>
                <td className="py-2">string</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-2 pr-4 font-mono">user.name</td>
                <td className="py-2">string</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-2 pr-4 font-mono">organization_id</td>
                <td className="py-2">string</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-mono">api_key_id</td>
                <td className="py-2">string</td>
              </tr>
            </tbody>
          </table>
        </>
      ),
      code: {
        curl: `curl ${BASE}/api/public/v1/me \\
  -H "Authorization: Bearer dc_live_xxxxxxxxxxxxxxxx"

# Response
{
  "user": {
    "id": "clx...",
    "email": "dev@example.com",
    "name": "Jane"
  },
  "organization_id": "clx...",
  "api_key_id": "clx..."
}`,
        javascript: `const res = await fetch("${BASE}/api/public/v1/me", {
  headers: { Authorization: \`Bearer \${apiKey}\` },
});
const data = await res.json();
console.log(data.user.email);`,
        python: `res = requests.get(
    "${BASE}/api/public/v1/me",
    headers={"Authorization": f"Bearer {api_key}"},
)
print(res.json()["user"]["email"])`,
      },
    },
    {
      id: "list-reminders",
      title: "List reminders",
      group: "core-resources",
      prose: (
        <>
          <p className="font-mono text-cyan-300 text-sm mb-2">
            GET /api/public/v1/reminders
          </p>
          <p>
            Returns a paginated list of reminders for the authenticated user.
            Supports filtering by status, text search, date range, and
            sort order.
          </p>
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-2 pr-4">Parameter</th>
                <th className="pb-2 pr-4">Type</th>
                <th className="pb-2">Description</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 dark:text-slate-300">
              <tr className="border-b border-slate-800">
                <td className="py-2 pr-4 font-mono">status</td>
                <td className="py-2 pr-4">string</td>
                <td className="py-2">scheduled, paused, completed, failed, in_progress</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-2 pr-4 font-mono">search</td>
                <td className="py-2 pr-4">string</td>
                <td className="py-2">Text search on title and message</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-2 pr-4 font-mono">sort</td>
                <td className="py-2 pr-4">string</td>
                <td className="py-2">scheduled_at_asc, scheduled_at_desc, updated_at_desc</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-2 pr-4 font-mono">page</td>
                <td className="py-2 pr-4">integer</td>
                <td className="py-2">Default 1</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-mono">page_size</td>
                <td className="py-2 pr-4">integer</td>
                <td className="py-2">Default 20, max 100</td>
              </tr>
            </tbody>
          </table>
        </>
      ),
      code: {
        curl: `curl "${BASE}/api/public/v1/reminders?status=scheduled&page_size=5" \\
  -H "Authorization: Bearer dc_live_xxxxxxxxxxxxxxxx"

# Response
{
  "items": [
    {
      "id": 42,
      "title": "Take medication",
      "message": "Time for your pills",
      "phone_number": "+14155552671",
      "scheduled_at": "2026-03-25T13:00:00Z",
      "timezone": "America/New_York",
      "status": "scheduled",
      ...
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 5,
  "total_pages": 1
}`,
        javascript: `const res = await fetch(
  "${BASE}/api/public/v1/reminders?status=scheduled",
  { headers: { Authorization: \`Bearer \${apiKey}\` } }
);
const { items, total } = await res.json();`,
        python: `res = requests.get(
    "${BASE}/api/public/v1/reminders",
    params={"status": "scheduled", "page_size": 5},
    headers={"Authorization": f"Bearer {api_key}"},
)
items = res.json()["items"]`,
      },
    },
    {
      id: "create-reminder",
      title: "Create reminder",
      group: "core-resources",
      prose: (
        <>
          <p className="font-mono text-cyan-300 text-sm mb-2">
            POST /api/public/v1/reminders
          </p>
          <p>
            Creates a new reminder that will trigger a phone call at the
            scheduled time.
          </p>
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-2 pr-4">Field</th>
                <th className="pb-2 pr-4">Required</th>
                <th className="pb-2">Description</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 dark:text-slate-300">
              <tr className="border-b border-slate-800">
                <td className="py-2 pr-4 font-mono">title</td>
                <td className="py-2 pr-4 text-slate-900 dark:text-white">Yes</td>
                <td className="py-2">Short reminder title (max 255 chars)</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-2 pr-4 font-mono">message</td>
                <td className="py-2 pr-4 text-slate-900 dark:text-white">Yes</td>
                <td className="py-2">Message spoken during the call (max 1000 chars)</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-2 pr-4 font-mono">phone_number</td>
                <td className="py-2 pr-4 text-slate-900 dark:text-white">Yes</td>
                <td className="py-2">E.164 format, e.g. +14155552671</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-2 pr-4 font-mono">scheduled_at</td>
                <td className="py-2 pr-4 text-slate-900 dark:text-white">Yes</td>
                <td className="py-2">Local datetime string (future)</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-2 pr-4 font-mono">timezone</td>
                <td className="py-2 pr-4 text-slate-900 dark:text-white">Yes</td>
                <td className="py-2">IANA timezone, e.g. America/New_York</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-2 pr-4 font-mono">recurrence_type</td>
                <td className="py-2 pr-4">No</td>
                <td className="py-2">daily, weekly, or custom</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-mono">recurrence_config</td>
                <td className="py-2 pr-4">No</td>
                <td className="py-2">{`{interval_days:N} or {weekdays:[0-6]}`}</td>
              </tr>
            </tbody>
          </table>
        </>
      ),
      code: {
        curl: `curl -X POST "${BASE}/api/public/v1/reminders" \\
  -H "Authorization: Bearer dc_live_xxxxxxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Take medication",
    "message": "Please take your medication now.",
    "phone_number": "+14155552671",
    "scheduled_at": "2026-03-25T09:00:00",
    "timezone": "America/New_York",
    "recurrence_type": "daily"
  }'

# → 201 Created`,
        javascript: `const res = await fetch("${BASE}/api/public/v1/reminders", {
  method: "POST",
  headers: {
    Authorization: \`Bearer \${process.env.DIALCUES_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    title: "Take medication",
    message: "Please take your medication now.",
    phone_number: "+14155552671",
    scheduled_at: "2026-03-25T09:00:00",
    timezone: "America/New_York",
    recurrence_type: "daily",
  }),
});

if (!res.ok) throw new Error(await res.text());
const reminder = await res.json();`,
        python: `import os, requests

res = requests.post(
    "${BASE}/api/public/v1/reminders",
    headers={"Authorization": f"Bearer {os.environ['DIALCUES_API_KEY']}"},
    json={
        "title": "Take medication",
        "message": "Please take your medication now.",
        "phone_number": "+14155552671",
        "scheduled_at": "2026-03-25T09:00:00",
        "timezone": "America/New_York",
        "recurrence_type": "daily",
    },
    timeout=20,
)
res.raise_for_status()
reminder = res.json()`,
        php: `$payload = json_encode([
  "title" => "Take medication",
  "message" => "Please take your medication now.",
  "phone_number" => "+14155552671",
  "scheduled_at" => "2026-03-25T09:00:00",
  "timezone" => "America/New_York",
  "recurrence_type" => "daily",
]);

$ch = curl_init("${BASE}/api/public/v1/reminders");
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => [
    "Authorization: Bearer " . getenv("DIALCUES_API_KEY"),
    "Content-Type: application/json",
  ],
  CURLOPT_POSTFIELDS => $payload,
]);
$response = curl_exec($ch);`,
        java: `String body = """
  {"title":"Take medication","message":"Please take your medication now.",
   "phone_number":"+14155552671","scheduled_at":"2026-03-25T09:00:00",
   "timezone":"America/New_York","recurrence_type":"daily"}""";

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("${BASE}/api/public/v1/reminders"))
    .header("Authorization", "Bearer " + System.getenv("DIALCUES_API_KEY"))
    .header("Content-Type", "application/json")
    .POST(HttpRequest.BodyPublishers.ofString(body))
    .build();`,
        go: `body := []byte(\`{
  "title":"Take medication",
  "message":"Please take your medication now.",
  "phone_number":"+14155552671",
  "scheduled_at":"2026-03-25T09:00:00",
  "timezone":"America/New_York",
  "recurrence_type":"daily"
}\`)
req, _ := http.NewRequest("POST",
  "${BASE}/api/public/v1/reminders",
  bytes.NewBuffer(body))
req.Header.Set("Authorization", "Bearer "+os.Getenv("DIALCUES_API_KEY"))
req.Header.Set("Content-Type", "application/json")
resp, err := http.DefaultClient.Do(req)`,
        ruby: `uri = URI("${BASE}/api/public/v1/reminders")
req = Net::HTTP::Post.new(uri)
req["Authorization"] = "Bearer #{ENV.fetch("DIALCUES_API_KEY")}"
req["Content-Type"] = "application/json"
req.body = {
  title: "Take medication",
  message: "Please take your medication now.",
  phone_number: "+14155552671",
  scheduled_at: "2026-03-25T09:00:00",
  timezone: "America/New_York",
  recurrence_type: "daily",
}.to_json
res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) { |h| h.request(req) }`,
        csharp: `var client = new HttpClient();
client.DefaultRequestHeaders.Add("Authorization",
    $"Bearer {Environment.GetEnvironmentVariable("DIALCUES_API_KEY")}");

var json = JsonSerializer.Serialize(new {
    title = "Take medication",
    message = "Please take your medication now.",
    phone_number = "+14155552671",
    scheduled_at = "2026-03-25T09:00:00",
    timezone = "America/New_York",
    recurrence_type = "daily",
});
var res = await client.PostAsync(
    "${BASE}/api/public/v1/reminders",
    new StringContent(json, Encoding.UTF8, "application/json"));`,
      },
    },
    {
      id: "get-reminder",
      title: "Retrieve reminder",
      group: "core-resources",
      prose: (
        <>
          <p className="font-mono text-cyan-300 text-sm mb-2">
            GET /api/public/v1/reminders/:id
          </p>
          <p>Retrieves a single reminder by its integer id.</p>
        </>
      ),
      code: {
        curl: `curl ${BASE}/api/public/v1/reminders/42 \\
  -H "Authorization: Bearer dc_live_xxxxxxxxxxxxxxxx"

# → 200 OK  (full reminder object)`,
        javascript: `const res = await fetch("${BASE}/api/public/v1/reminders/42", {
  headers: { Authorization: \`Bearer \${apiKey}\` },
});
const reminder = await res.json();`,
        python: `res = requests.get(
    "${BASE}/api/public/v1/reminders/42",
    headers={"Authorization": f"Bearer {api_key}"},
)
reminder = res.json()`,
      },
    },
    {
      id: "update-reminder",
      title: "Update reminder",
      group: "core-resources",
      prose: (
        <>
          <p className="font-mono text-cyan-300 text-sm mb-2">
            PATCH /api/public/v1/reminders/:id
          </p>
          <p>
            Updates a reminder that is in <code>scheduled</code>,{" "}
            <code>paused</code>, or <code>failed</code> state. Send only the
            fields you want to change. Supports rescheduling, content edits,
            pause/resume, and recurrence changes.
          </p>
        </>
      ),
      code: {
        curl: `curl -X PATCH "${BASE}/api/public/v1/reminders/42" \\
  -H "Authorization: Bearer dc_live_xxxxxxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{"title": "Updated title", "scheduled_at": "2026-03-26T10:00:00"}'

# → 200 OK  (updated reminder object)`,
        javascript: `const res = await fetch("${BASE}/api/public/v1/reminders/42", {
  method: "PATCH",
  headers: {
    Authorization: \`Bearer \${apiKey}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ title: "Updated title" }),
});`,
        python: `res = requests.patch(
    "${BASE}/api/public/v1/reminders/42",
    headers={"Authorization": f"Bearer {api_key}"},
    json={"title": "Updated title"},
)`,
      },
    },
    {
      id: "delete-reminder",
      title: "Delete reminder",
      group: "core-resources",
      prose: (
        <>
          <p className="font-mono text-cyan-300 text-sm mb-2">
            DELETE /api/public/v1/reminders/:id
          </p>
          <p>Permanently deletes a reminder by its id. Returns 204 No Content.</p>
        </>
      ),
      code: {
        curl: `curl -X DELETE "${BASE}/api/public/v1/reminders/42" \\
  -H "Authorization: Bearer dc_live_xxxxxxxxxxxxxxxx"

# → 204 No Content`,
        javascript: `await fetch("${BASE}/api/public/v1/reminders/42", {
  method: "DELETE",
  headers: { Authorization: \`Bearer \${apiKey}\` },
});`,
        python: `requests.delete(
    "${BASE}/api/public/v1/reminders/42",
    headers={"Authorization": f"Bearer {api_key}"},
)`,
      },
    },
    {
      id: "list-executions",
      title: "List executions",
      group: "history",
      prose: (
        <>
          <p className="font-mono text-cyan-300 text-sm mb-2">
            GET /api/public/v1/executions
          </p>
          <p>
            Returns a paginated list of call execution records. Each execution
            represents a single outbound call attempt.
          </p>
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-2 pr-4">Parameter</th>
                <th className="pb-2 pr-4">Type</th>
                <th className="pb-2">Description</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 dark:text-slate-300">
              <tr className="border-b border-slate-800">
                <td className="py-2 pr-4 font-mono">date_from</td>
                <td className="py-2 pr-4">string</td>
                <td className="py-2">ISO datetime lower bound</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-2 pr-4 font-mono">date_to</td>
                <td className="py-2 pr-4">string</td>
                <td className="py-2">ISO datetime upper bound</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-2 pr-4 font-mono">page</td>
                <td className="py-2 pr-4">integer</td>
                <td className="py-2">Default 1</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-mono">page_size</td>
                <td className="py-2 pr-4">integer</td>
                <td className="py-2">Default 20, max 100</td>
              </tr>
            </tbody>
          </table>
        </>
      ),
      code: {
        curl: `curl "${BASE}/api/public/v1/executions?page_size=5" \\
  -H "Authorization: Bearer dc_live_xxxxxxxxxxxxxxxx"

# Response
{
  "items": [
    {
      "id": 101,
      "reminder_id": 42,
      "reminder_title": "Take medication",
      "status": "completed",
      "call_id": "abc-123",
      "executed_at": "2026-03-25T13:00:12Z"
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 5,
  "total_pages": 1
}`,
        javascript: `const res = await fetch(
  "${BASE}/api/public/v1/executions?page_size=5",
  { headers: { Authorization: \`Bearer \${apiKey}\` } }
);
const { items } = await res.json();`,
        python: `res = requests.get(
    "${BASE}/api/public/v1/executions",
    params={"page_size": 5},
    headers={"Authorization": f"Bearer {api_key}"},
)
items = res.json()["items"]`,
      },
    },
  ];
}

const SIDEBAR_GROUPS = [
  { key: "getting-started", label: "Getting Started" },
  { key: "core-resources", label: "Core Resources" },
  { key: "history", label: "History" },
] as const;

function copyText(value: string) {
  navigator.clipboard.writeText(value).catch(() => undefined);
}

function CodePanel({
  code,
  language,
  setLanguage,
}: {
  code: Partial<Record<LanguageKey, string>>;
  language: LanguageKey;
  setLanguage: (l: LanguageKey) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const effectiveLanguage = code[language] ? language : (Object.keys(code)[0] as LanguageKey);
  const snippet = code[effectiveLanguage] ?? "";
  const currentLabel = LANGUAGES.find((l) => l.key === effectiveLanguage)?.label ?? effectiveLanguage;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleCopy() {
    copyText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0b1222] overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-[#0d1527] px-4 py-2">
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white"
          >
            {currentLabel}
            <ChevronDown className="h-3 w-3" />
          </button>
          {dropdownOpen && (
            <div className="absolute left-0 top-full mt-1 z-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111b33] py-1 shadow-xl min-w-[140px]">
              {LANGUAGES.filter((l) => code[l.key]).map((l) => (
                <button
                  key={l.key}
                  type="button"
                  className={`w-full text-left px-3 py-1.5 text-xs transition ${
                    l.key === effectiveLanguage
                      ? "text-cyan-200 bg-cyan-500/15"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white"
                  }`}
                  onClick={() => {
                    setLanguage(l.key);
                    setDropdownOpen(false);
                  }}
                >
                  {l.label}
                  {l.key === effectiveLanguage && (
                    <Check className="inline h-3 w-3 ml-2 text-cyan-300" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
      <pre className="p-4 text-[13px] leading-relaxed overflow-x-auto text-slate-800 dark:text-slate-200 max-h-[480px] overflow-y-auto bg-white dark:bg-transparent">
        <code>{snippet}</code>
      </pre>
    </div>
  );
}

export default function ApiDocsPage() {
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState<LanguageKey>("curl");
  const [activeAnchor, setActiveAnchor] = useState("introduction");
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({
    "getting-started": false,
    "core-resources": false,
    history: false,
  });
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const sections = useMemo(() => mkSections(), []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveAnchor(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0.1 }
    );

    for (const section of sections) {
      const el = sectionRefs.current[section.id];
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [sections]);

  const tokens = useMemo(
    () => query.toLowerCase().split(/\s+/).filter(Boolean),
    [query]
  );

  const visibleSections = useMemo(() => {
    if (tokens.length === 0) return sections;
    return sections.filter((section) => {
      const haystack = `${section.title} ${section.id}`.toLowerCase();
      return tokens.every((t) => haystack.includes(t));
    });
  }, [sections, tokens]);

  function toggleGroup(groupKey: string) {
    setCollapsedGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0f1c] text-slate-900 dark:text-slate-100">
      <Header />

      <div className="mx-auto max-w-[1600px] grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] min-h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <aside className="hidden lg:block border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[radial-gradient(circle_at_top_left,#18233f_0%,#0c1120_35%,#090d18_100%)] px-4 py-4 sticky top-16 self-start h-[calc(100vh-64px)] max-h-[calc(100vh-64px)] overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#334155_transparent]">
          <div className="mb-4 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-cyan-500 dark:text-cyan-300" />
            <span className="text-sm font-semibold text-slate-900 dark:text-white">dialcues API</span>
          </div>

          <div className="relative mb-4">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find anything"
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0a0f1c] pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
            />
          </div>

          <nav className="space-y-4">
            {SIDEBAR_GROUPS.map((group) => {
              const items = visibleSections.filter((s) => s.group === group.key);
              if (items.length === 0) return null;
              const isCollapsed = !!collapsedGroups[group.key];
              return (
                <div key={group.key}>
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.key)}
                    className="w-full flex items-center justify-between px-2 py-1.5 mb-1 text-left"
                  >
                    <p className="text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      {group.label}
                    </p>
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-slate-400 dark:text-slate-500 transition ${isCollapsed ? "-rotate-90" : "rotate-0"}`}
                    />
                  </button>

                  {!isCollapsed && items.map((section) => (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className={`block rounded-md px-2.5 py-1.5 text-[13px] transition ${
                        activeAnchor === section.id
                          ? "bg-gradient-to-r from-indigo-600/45 to-indigo-500/10 text-indigo-100 shadow-[inset_0_0_0_1px_rgba(129,140,248,0.35)]"
                          : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
                      }`}
                    >
                      {section.title}
                    </a>
                  ))}
                </div>
              );
            })}
          </nav>

          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Link
              href="/settings"
              className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to settings
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <main className="overflow-hidden">
          {/* Mobile back link */}
          <div className="lg:hidden px-4 pt-4">
            <Link
              href="/settings"
              className="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to settings
            </Link>
          </div>

          {visibleSections.map((section) => (
            <div
              key={section.id}
              id={section.id}
              ref={(el) => { sectionRefs.current[section.id] = el; }}
              className="border-b border-slate-200 dark:border-slate-800"
            >
              <div className="grid grid-cols-1 xl:grid-cols-2 min-h-0">
                {/* Left: prose */}
                <div className="px-6 lg:px-10 py-8 xl:border-r xl:border-slate-200 dark:xl:border-slate-800">
                  <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white mb-4">
                    {section.title}
                  </h2>
                  <div className="prose-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {section.prose}
                  </div>
                </div>

                {/* Right: code */}
                <div className="px-6 lg:px-8 py-8 bg-slate-100 dark:bg-[#080e1a]">
                  <CodePanel
                    code={section.code}
                    language={language}
                    setLanguage={setLanguage}
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="px-6 lg:px-10 py-6 text-xs text-slate-500">
            Canonical docs: <code>docs/public-api.md</code> and{" "}
            <code>docs/public-api.openapi.yaml</code>.
          </div>
        </main>
      </div>
    </div>
  );
}
