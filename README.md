# Dialcues

Voice call reminders powered by AI. Users schedule reminders and receive a phone call at the right time—no more silent notifications.

**Stack:** Next.js 16, Express, Prisma, PostgreSQL, Better Auth (email/password, orgs, email flows), Vapi AI, optional Resend for email delivery

---

## Quick Start

### Prerequisites

- **Node.js** 20+
- **PostgreSQL** (local, [Neon](https://neon.tech), or [Render](https://render.com))
- **Vapi account** at [vapi.ai](https://vapi.ai) (users add their own keys in Settings)

### 1. Clone & install

```bash
git clone <repo-url>
cd callMeReminder

# Backend
cd backend && npm install
cp .example.env .env
# Edit .env (see Environment Variables below)

# Frontend
cd ../frontend && npm install
cp .example.env .env.local
# Edit .env.local: NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 2. Database

```bash
cd backend
npx prisma db push
```

### 3. Run both servers

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

- Frontend: http://localhost:3000  
- Backend: http://localhost:8000  

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `BETTER_AUTH_SECRET` | Yes | Auth secret. Generate: `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Yes | Public URL of **this API** (e.g. `http://localhost:8000` or `https://api.yourapp.com`) |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `CORS_ORIGINS` | No | Comma-separated frontend origins. Production must include your app URL |
| `FRONTEND_URL` | **Prod** | Public URL of the Next.js app (e.g. `https://yourapp.vercel.app`). Used for invitation links, verification email links, and email HTML |
| `BETTER_AUTH_API_KEY` | No | [Better Auth Dashboard](https://dash.better-auth.com) (activity tracking) |
| `PORT` | No | Default: 8000 |
| `RESEND_API_KEY` | No | [Resend](https://resend.com) API key. Without it, auth emails are skipped (logged in dev) |
| `EMAIL_FROM` | No | Sender, e.g. `Dialcues <noreply@yourdomain.com>` (domain must be verified in Resend) |
| `OPENROUTER_API_KEY` | No | For AI-generated company prompts in Settings (optional; fallback template if unset) |
| `API_PUBLIC_URL` | No | Backend URL reachable by Vapi. Required for voice actions (snooze/dismiss). Local: [ngrok](https://ngrok.com) |
| `VOICE_ACTION_SECRET` | No | Secret for signing voice action tokens |

**Note:** Vapi API keys are stored per user in the database (Settings → Vapi). No global Vapi env vars are required on the server.

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend URL (e.g. `http://localhost:8000`) |
| `NEXT_PUBLIC_SITE_URL` | **Prod** | Public site origin (e.g. `https://yourapp.vercel.app`). Used for absolute redirects, password-reset `redirectTo`, signup/login callbacks, and SEO defaults. Should match `FRONTEND_URL` |

---

## Project Structure

```
callMeReminder/
├── docs/
│   ├── public-api.md          # Public REST API guide (auth, endpoints, SDK examples)
│   └── public-api.openapi.yaml# OpenAPI 3.0 spec for /api/public/v1
│
├── frontend/                 # Next.js 16 (App Router)
│   ├── src/app/              # /, /dashboard, /history, /login, /signup, /settings,
│   │                         # /onboarding/organization, /forgot-password, /reset-password,
│   │                         # /verify-email, /accept-invitation/[id], /docs/vapi, …
│   ├── src/components/       # ui, reminder, dashboard, layout, settings (Vapi, org, prompts, templates)
│   ├── src/lib/              # api.ts, auth-client.ts, site-url.ts, utils.ts, …
│   └── .example.env
│
├── backend/
│   ├── index.js              # Express, CORS, Better Auth at /api/auth/*
│   ├── auth.js               # Better Auth: email/password, verification, reset, org plugin, Resend
│   ├── prisma/schema.prisma  # User, Session, Organization, Member, Invitation, Reminder, VapiConfig, PromptProfile, …
│   ├── routes/               # reminders, stats, settings, vapi-configs, templates, …
│   ├── services/             # scheduler, vapi, prompt-generator, email (Resend)
│   ├── middleware/           # requireAuth, requireOrg, requireOrgRole
│   └── .example.env
│
├── ROADMAP.md
└── README.md
```

---

## Key Concepts

### Organizations (SaaS)

- Each user belongs to **at most one** organization (`member.userId` is unique).
- Users complete **organization onboarding** (`/onboarding/organization`): create an org or accept an invitation.
- **Organization context** comes from the user’s membership row in the database, not from switching “active” orgs in the session.
- Shared **prompt profiles**, **Vapi configs**, and **reminder templates** are scoped to that organization.
- Roles: **owner**, **admin**, **member** (invite UI uses admin/member; owner is typically the creator).

### Scheduling

- Scheduler runs every ~15 seconds (`services/scheduler.js`).
- Picks due reminders, calls Vapi, updates status; supports retries for failed calls.

### Auth

- **Better Auth:** email/password, optional email verification and password reset (when `RESEND_API_KEY` is set).
- Session cookies; API routes use `requireAuth`. Org-scoped mutations use **`requireOrg`** (membership lookup) and often **`requireOrgRole("owner", "admin")`** (see `middleware/auth.js`).
- Frontend: `AuthGuard` redirects unauthenticated users to `/login`; users without an organization membership are sent to `/onboarding/organization`.

### Vapi

- **Vapi configs and phone numbers** live under the organization (Settings); owners/admins edit, members typically view.
- Outbound calls use the **organization’s** Vapi keys/lines (resolved via the user’s membership). Optional **company prompt** is per organization (custom or AI-generated).

### Voice actions (optional)

With `API_PUBLIC_URL` and `VOICE_ACTION_SECRET`, callers can snooze/dismiss/repeat via voice. See in-app docs.

---

## API Reference (summary)

Better Auth exposes **`/api/auth/*`** (session, sign-in, sign-up, organizations, invitations, etc.).

REST examples (all cookie-authenticated unless noted):

| Area | Examples |
|------|----------|
| Reminders | `GET/POST /api/reminders`, `GET /api/reminders/executions`, … |
| Stats | `GET /api/stats`, `GET /api/stats/ops` (scheduler status) |
| Settings | `GET /api/settings`, `PUT /api/settings/prompt`, `POST /api/settings/prompt/generate` |
| Vapi configs | `GET/POST /api/vapi-configs`, … |
| Templates | `GET/POST/DELETE /api/templates` |
| Public API keys (owner/admin) | `GET/POST /api/public-api-keys`, `POST /api/public-api-keys/:id/revoke` |
| Public REST API (Bearer key) | `GET /api/public/v1/me`, `GET/POST/PATCH/DELETE /api/public/v1/reminders`, `GET /api/public/v1/executions` |

### Public API docs

- Guide: `docs/public-api.md`
- OpenAPI spec: `docs/public-api.openapi.yaml`

---

## Commands

| Command | Where | Description |
|---------|-------|-------------|
| `npm run dev` | backend | API with watch mode |
| `npm run dev` | frontend | Next.js dev server |
| `npm run build` | frontend | Production build |
| `npx prisma db push` | backend | Sync schema to DB |
| `npx prisma studio` | backend | Prisma Studio |

---

## Testing the Call Flow

1. Start backend and frontend; configure `.env` / `.env.local`.
2. Sign up → complete **organization** setup if prompted.
3. **Settings** → add Vapi integration and a phone number (see in-app guide).
4. Create a reminder a few minutes ahead with your phone in E.164 format.
5. Watch status: scheduled → in progress → completed.

---

## Troubleshooting

| Issue | Check |
|-------|-------|
| Call not triggering | Scheduler logs; reminder time (UTC); Vapi keys and numbers in Settings |
| Frontend ↔ API | `NEXT_PUBLIC_API_URL`; `CORS_ORIGINS` includes frontend origin |
| Auth / cookies | `BETTER_AUTH_URL` is the API’s public URL; `BETTER_AUTH_SECRET`; HTTPS + `SameSite` in production |
| Emails not sending | `RESEND_API_KEY`, `EMAIL_FROM`, verified domain in Resend; `FRONTEND_URL` on API for links |
| Verification / reset links wrong | `FRONTEND_URL` (backend) and `NEXT_PUBLIC_SITE_URL` (frontend) match your live app URL |
| Org onboarding loop | Ensure `member` row exists (create org or accept invite); no separate “set active org” step required for our API |
| Vapi errors | Vapi dashboard; phone number ID; credits |

---

## Deployment

- **Frontend:** Vercel — set `NEXT_PUBLIC_API_URL` and **`NEXT_PUBLIC_SITE_URL`** to the deployed frontend origin.
- **Backend:** Render / Railway / etc. — set **`BETTER_AUTH_URL`** to this service’s public URL, **`FRONTEND_URL`** to the Next.js URL, **`CORS_ORIGINS`** to the frontend origin, and email vars if using Resend.
- **Database:** Neon, Render Postgres, Supabase, etc.

---

## Design System

- **Colors:** Primary `#2563eb`, Secondary `#06b6d4`, Accent `#22c55e`, Dark `#0f172a`, Light `#f8fafc`
- **Fonts:** Outfit (body), Space Grotesk (headings), JetBrains Mono (code)
- **Components:** `frontend/src/components/ui/`
