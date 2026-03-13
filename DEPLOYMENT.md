# Deploy CallMe Reminder (Free Tier)

This guide deploys your app at **$0/month** using:
- **Frontend** → Vercel (free Hobby plan)
- **Backend** → Render (free tier)
- **Database** → Render PostgreSQL (free tier)

---

## ⚠️ IMPORTANT: Use External Database URL

If you see **"could not translate host name dpg-xxx to address"**, you're using the **Internal** URL.

**Fix:** In Render → PostgreSQL → **Connect** → copy the **External Database URL** (not Internal) → set it as `DATABASE_URL` in your web service.

---

## Prerequisites

- [GitHub](https://github.com) account
- [Vercel](https://vercel.com) account (free)
- [Render](https://render.com) account (free, no credit card)
- [Vapi](https://vapi.ai) account (for voice calls)

---

## Step 1: Deploy Backend to Render

### 1.1 Create PostgreSQL Database

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **PostgreSQL**
3. Name it `callme-reminder-db`
4. **Region**: Choose closest to your users
5. **Plan**: Free
6. Click **Create Database**
7. Wait for it to be ready
8. Go to **Connect** → copy **External Database URL** (the one with `*.render.com` in the host, NOT `dpg-xxx-a`)

### 1.2 Create Web Service (Backend)

1. Click **New +** → **Web Service**
2. Connect your GitHub repo
3. Configure:
   - **Name**: `callme-reminder-api`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install && npx prisma generate && npx prisma db push`
   - **Start Command**: `npm start`

4. **Environment Variables** — add these (use **External** URL for DATABASE_URL):
   | Key | Value |
   |-----|-------|
   | `BETTER_AUTH_SECRET` | Generate with `openssl rand -base64 32` |
   | `BETTER_AUTH_URL` | `https://callme-reminder-api.onrender.com` |
   | `DATABASE_URL` | **External Database URL** from PostgreSQL → Connect |
   | `CORS_ORIGINS` | `https://YOUR_APP.vercel.app` (exact Vercel URL, no trailing slash) |

5. Click **Create Web Service**

6. Copy your backend URL: `https://callme-reminder-api.onrender.com`

### 1.3 Keep Backend Awake (Free Tier)

1. Go to [cron-job.org](https://cron-job.org)
2. Create cronjob: `https://callme-reminder-api.onrender.com/health` every 10 minutes

---

## Step 2: Deploy Frontend to Vercel

1. [Vercel Dashboard](https://vercel.com/dashboard) → Add Project → Import repo
2. **Root Directory**: `frontend`
3. **Environment Variable**: `NEXT_PUBLIC_API_URL` = your Render backend URL
4. Deploy
5. Update `CORS_ORIGINS` in Render with your Vercel URL

---

## Troubleshooting

### "could not translate host name dpg-xxx to address"

You're using the **Internal** Database URL. Internal hostnames (`dpg-xxxxx-a`) only work on Render's private network and often fail.

**Fix:** Replace `DATABASE_URL` with the **External** URL:
1. Render Dashboard → your PostgreSQL database
2. **Connect** button
3. Copy **External Database URL** (host looks like `dpg-xxx.frankfurt-postgres.render.com`)
4. Web Service → Environment → Edit `DATABASE_URL` → paste External URL
5. Save (triggers redeploy)

### Prisma / DATABASE_URL

Ensure `DATABASE_URL` is set before build. Prisma needs it for `db push`. If the build fails, add `DATABASE_URL` as a secret in Render and redeploy.

### CORS errors (blocked by policy)

If you see "blocked by CORS policy" when logging in from Vercel:

1. **Render cold start** – Free tier sleeps after 15 min. First request can fail before the app wakes. Fix: Set up [cron-job.org](https://cron-job.org) to ping `https://YOUR_BACKEND.onrender.com/health` every 10 minutes.

2. **CORS_ORIGINS** – In Render → Environment, set to your Vercel URL: `https://callmereminder.vercel.app` (no trailing slash). Save and redeploy.

3. **Test backend is awake** – Open `https://callmereminder.onrender.com/health` in a new tab. If it returns `{"status":"healthy"}`, the backend is up. If it hangs or errors, wait 1–2 min and retry.
