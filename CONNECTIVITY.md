# FacilityDesk — Connection & Deployment Guide

## Why you see "Failed to fetch"

The browser calls `VITE_API_URL` from `web-admin/.env`. If that URL is unreachable from your PC, every login/register/API call fails.

**Your Railway backend is online** (health check returns `API Running` and DB is connected).

**Your PC currently cannot reach** `https://backend-pdd.up.railway.app` — local DNS/network blocks or fails to resolve Railway domains (common on some ISP DNS like Jio).

So pointing the local frontend at the Railway URL causes **Failed to fetch**, even though the server works elsewhere.

---

## Option A — Local development (recommended)

Use local backend + local frontend.

### 1. Backend `.env` (already set)

```env
DATABASE_PUBLIC_URL=postgresql://...@acela.proxy.rlwy.net:55068/railway
PORT=5000
HOST=0.0.0.0
```

### 2. Frontend `.env` (local)

```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Start both (two terminals)

**Terminal 1 — backend**
```bash
cd backend
node server.js
```
Wait for: `✓ Server running on http://localhost:5000`

**Terminal 2 — frontend** (restart if already running)
```bash
cd web-admin
npm run dev
```

### 4. Verify

- Open http://localhost:5173
- Browser console should show: `Using API_URL: http://localhost:5000/api`
- Login: manager / man123

**Important:** Vite reads `.env` only at startup. After changing `.env`, stop `npm run dev` (Ctrl+C) and start it again.

---

## Option B — Local frontend → Railway backend

Only use this if your PC can reach Railway.

### Test from PowerShell

```powershell
curl.exe https://backend-pdd.up.railway.app/
```

Expected: `{"message":"API Running","status":"success"}`

If you get `Could not resolve host` or timeout:

1. Change DNS to **8.8.8.8** and **8.8.4.4** (Google) or **1.1.1.1** (Cloudflare)
2. Run: `ipconfig /flushdns`
3. Retry curl

Then set `web-admin/.env`:

```env
VITE_API_URL=https://backend-pdd.up.railway.app/api
```

Restart `npm run dev`.

---

## Option C — Deploy frontend on Railway

When **both** frontend and backend run on Railway, use the public backend URL at **build time**.

### Railway backend service

| Setting | Value |
|---------|--------|
| Root directory | `backend` |
| Start command | `node server.js` |
| `PORT` | Set automatically by Railway (do not hardcode 5000) |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` or `DATABASE_PUBLIC_URL` for external DB |

Code already uses:

```javascript
const PORT = process.env.PORT || 8080;
```

### Railway frontend service (if you deploy web-admin)

| Variable | Value |
|----------|--------|
| `VITE_API_URL` | `https://backend-pdd.up.railway.app/api` |

Set this **before** `npm run build`. Vite bakes env vars into the bundle.

Or use `web-admin/.env.production` which already contains the Railway URL.

---

## Quick checklist

| Check | Command / action |
|-------|------------------|
| Backend health (Railway) | `curl https://backend-pdd.up.railway.app/` |
| DB health (Railway) | `curl https://backend-pdd.up.railway.app/test-db` |
| Local backend | `curl http://localhost:5000/` |
| Frontend env loaded | Console: `Using API_URL: ...` |
| After `.env` change | Restart `npm run dev` |

---

## Summary

| Setup | Frontend URL | Backend URL |
|-------|--------------|-------------|
| **Local dev** | http://localhost:5173 | http://localhost:5000/api |
| **Railway prod** | your-frontend.up.railway.app | https://backend-pdd.up.railway.app/api |

**Port 8080 fix on Railway is correct.** The remaining issue on your machine is not the port — it is **network/DNS to Railway** while developing locally. Use **localhost:5000** for daily development.
