# Dialcues

Voice call reminders powered by AI. Users schedule reminders and receive a phone call at the right time—no more silent notifications.

**Stack:** Next.js 16, Express, Prisma, PostgreSQL, Better Auth, Vapi AI

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
# Edit .env with your values (see Environment Variables below)

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
| `BETTER_AUTH_URL` | Yes | Backend URL. Local: `http://localhost:8000` |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `CORS_ORIGINS` | No | Comma-separated frontend URLs. Default includes localhost |
| `BETTER_AUTH_API_KEY` | No | For [Better Auth Dashboard](https://dash.better-auth.com) (activity tracking) |
| `PORT` | No | Default: 8000 |
| `API_PUBLIC_URL` | No | Backend URL reachable by Vapi (e.g. `https://api.yourapp.com`). Required for voice actions (snooze/dismiss by speaking during call). For local dev, use [ngrok](https://ngrok.com). |
| `VOICE_ACTION_SECRET` | No | Secret for signing voice action tokens. Generate: `openssl rand -base64 32`. Required when using voice actions. |

**Note:** Vapi API keys are stored per-user in the database. Users add them in Settings after signup. No backend env vars for Vapi.

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend URL. Local: `http://localhost:8000` |
| `NEXT_PUBLIC_SITE_URL` | No | For SEO/sitemap. Default: `https://dialcues.com` |

---

## Project Structure

```
callMeReminder/
├── frontend/                 # Next.js 16 (App Router)
│   ├── src/
│   │   ├── app/              # Routes: /, /dashboard, /login, /signup, /settings, /docs/vapi
│   │   ├── components/
│   │   │   ├── ui/           # Button, Input, Card, Modal, etc.
│   │   │   ├── reminder/     # ReminderForm, ReminderList, ReminderCard
│   │   │   ├── dashboard/    # FilterTabs, SearchInput, StatsCards
│   │   │   └── layout/       # Header (with mobile menu)
│   │   ├── lib/              # api.ts, auth-client.ts, utils.ts, theme-provider
│   │   └── types/
│   └── .example.env
│
├── backend/
│   ├── index.js              # Express server, CORS, Better Auth mount
│   ├── auth.js               # Better Auth config (email/password, dash plugin)
│   ├── prisma/
│   │   └── schema.prisma     # User, Session, Reminder, VapiConfig, VapiPhoneNumber
│   ├── routes/               # /api/reminders, /api/stats, /api/settings
│   ├── services/
│   │   ├── scheduler.js     # 15s interval, processes due reminders
│   │   └── vapi.js           # Vapi API client, initiates calls
│   ├── middleware/           # Auth middleware for protected routes
│   └── .example.env
│
└── README.md
```

---

## Key Concepts

### Scheduling

- A **scheduler** runs every 15 seconds (`services/scheduler.js`)
- Queries reminders where `status = 'scheduled'` and `scheduled_at <= now`
- For each due reminder: sets `in_progress` → calls Vapi → sets `completed` or `failed`
- Timezone: reminders store `scheduled_at` in UTC; frontend uses user's timezone for display

### Auth

- **Better Auth** with email/password
- Session-based (cookies)
- Protected routes: `/api/reminders`, `/api/stats`, `/api/settings` require auth
- `AuthGuard` component redirects unauthenticated users to `/login`

### Vapi

- Each user adds **Vapi** lines in Settings (API key per config, one or more phone number IDs)
- Stored in `vapi_configs` / `vapi_phone_numbers` (API key masked in API responses)
- When a reminder is due, backend fetches the user's Vapi credentials and initiates the call
- Voice message: *"Hello! This is Dialcues. Your reminder: [title]. [message]. Goodbye!"*

### Voice Actions (optional)

When `API_PUBLIC_URL` and `VOICE_ACTION_SECRET` are set, users can speak during the call to:
- **Snooze** — e.g. "snooze for 10 minutes", "remind me in an hour", "tomorrow"
- **Dismiss** — e.g. "dismiss", "I'm done"
- **Repeat** — "repeat" (assistant repeats the message)

The assistant asks after delivering the reminder. For local dev, expose your backend with [ngrok](https://ngrok.com) and set `API_PUBLIC_URL` to the ngrok URL.

---

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/reminders` | Yes | List reminders. Query: `status`, `search`, `page`, `page_size` |
| POST | `/api/reminders` | Yes | Create reminder |
| POST | `/api/reminders/voice-action` | No | Voice actions (snooze/dismiss during call) — uses signed token |
| GET | `/api/reminders/:id` | Yes | Get reminder |
| PUT | `/api/reminders/:id` | Yes | Update reminder |
| DELETE | `/api/reminders/:id` | Yes | Delete reminder |
| GET | `/api/stats` | Yes | Reminder counts by status |
| GET | `/api/settings` | Yes | User's Vapi config (masked) |
| PUT | `/api/settings` | Yes | Update Vapi config |
| POST | `/api/settings/test` | Yes | Test Vapi credentials |

Auth routes: `POST /api/auth/*` (handled by Better Auth)

---

## Commands

| Command | Where | Description |
|---------|-------|-------------|
| `npm run dev` | backend | Start API with hot reload |
| `npm run dev` | frontend | Start Next.js dev server |
| `npm run build` | frontend | Production build |
| `npx prisma db push` | backend | Sync schema to DB (no migrations) |
| `npx prisma studio` | backend | Open Prisma Studio (DB GUI) |

---

## Testing the Call Flow

1. Start backend and frontend
2. Sign up or log in
3. Go to **Settings** → add your Vapi API key and Phone Number ID (see in-app guide)
4. Create a reminder: set time 2–3 minutes in the future, use your real phone number (E.164)
5. Wait for the call—status will change from Scheduled → In Progress → Completed

---

## Troubleshooting

| Issue | Check |
|-------|-------|
| Call not triggering | Backend logs for scheduler; reminder time in future (UTC); user has Vapi keys in Settings |
| Frontend can't reach backend | `NEXT_PUBLIC_API_URL` correct; backend on 8000; CORS includes frontend URL |
| Login/signup fails | `BETTER_AUTH_SECRET` set; `BETTER_AUTH_URL` matches backend URL; DB connected |
| Vapi call fails | Vapi dashboard logs; correct Phone Number ID; account has credits |
| Build errors | `npm install` in both folders; Node 20+ |

---

## Deployment

- **Frontend:** Vercel (connect repo, set `NEXT_PUBLIC_API_URL` to backend URL)
- **Backend:** Render, Railway, or similar (Node, set env vars, `npm start`)
- **Database:** Render PostgreSQL, Neon, or Supabase
- Ensure `CORS_ORIGINS` includes your production frontend URL

---

## Design System

- **Colors:** Primary `#2563eb`, Secondary `#06b6d4`, Accent `#22c55e`, Dark `#0f172a`, Light `#f8fafc`
- **Fonts:** Outfit (body), Space Grotesk (headings), JetBrains Mono (code)
- **Components:** See `frontend/src/components/ui/` for Button, Input, Card, Modal, etc.
