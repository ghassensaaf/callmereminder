# DialCues Roadmap

**Vision:** Reliable AI phone reminders—recurring or one-off—with a clear record of every call, so people do not miss what matters.

Phases below are ordered by **dependency** and **go-to-market**: ship a solid BYO-Vapi product first, then hosted convenience, then integrations.

---

## Shipped (today)

What the app already does; keep this section updated when you release features.

### Account & telephony (BYO Vapi)

- Sign up / sign in
- Vapi integration: API keys, multiple outbound numbers, default line per reminder
- In-app docs for configuring Vapi

### Reminders & scheduling

- One-time reminders and **recurring** reminders (daily, weekly, custom weekday patterns) with optional end date
- Per-reminder timezone; scheduler fires outbound calls at the right time
- Quick schedule presets (e.g. in 15 minutes, tomorrow 9:00, next Monday 9:00)
- **Snooze** from the dashboard (10 min / 1 hour / tomorrow) and **during the call** (signed voice actions)
- **Pause / resume** for recurring reminders
- Edit `scheduled_at` and content for eligible reminders (reschedule path)

### History & visibility

- **Call history** page: completed and failed executions, date filters, CSV export
- Stored execution metadata and optional **call details** (e.g. transcript-related payload from Vapi when available)

### Quality-of-life

- Reminder **message templates** (create in Settings, apply when composing)
- Dashboard filters, stats, search

---

## Near-term (polish before or alongside Phase 2)

Small, high-leverage improvements; not a new “phase” but worth tracking.

- History UX: surface transcripts / recordings consistently when `call_details` is present; “sync from Vapi” flows documented in UI
- Reliability: retry/alerting story for failed calls; clearer user-facing error states
- Onboarding: stronger empty states, optional default timezone from browser
- Recurrence: edge cases (DST, very long series) and any missing admin/ops visibility

---

## Phase 2: Hosted experience

**Goal:** Someone can use DialCues without creating a Vapi account or pasting API keys.

- DialCues-provisioned phone numbers (pool + per-user assignment)
- **Plans:** free tier with limits, paid tiers for volume and/or hosted numbers
- Simplified onboarding: sign up → add phone → set reminders (no vendor keys)

*Depends on:* billing, telephony provider abstraction, compliance (consent, recording if applicable).

---

## Phase 3: Developer platform

**Goal:** Third-party products can drive reminders programmatically.

- Public **REST** API (GraphQL only if there is a strong reason)
- CRUD (and list/filter) for reminders and read access to execution history as appropriate
- **API keys** for server-to-server; **OAuth** if you need user-delegated access for consumer apps
- Rate limits, versioning, and stable error shapes

*Natural order:* ship Phase 2 or a stable “BYO + API” slice first so the API contract matches production behavior.

---

## How to use this doc

- **Shipped** = user-visible capability in `main` (or your release branch).
- **Near-term** = optional backlog; reorder freely.
- **Phase 2 / 3** = strategic bets; break into milestones when you start execution.
