# ZaLife Daily OS — Deploy to Vercel

## Quick deploy (recommended)

### 1. Push to GitHub

```bash
cd "/Users/alenradi/Desktop/zalife daily os"
git init
git add .
git commit -m "Prepare ZaLife Daily OS for production"
```

Create a new repo on GitHub, then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/zalife-daily-os.git
git branch -M main
git push -u origin main
```

### 2. Import on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Vercel auto-detects **Vite** — keep defaults:
   - Build command: `npm run build`
   - Output directory: `dist`
4. Add environment variables (see below)
5. Click **Deploy**

### 3. Environment variables (Vercel → Project → Settings → Environment Variables)

Add these for **Production**, **Preview**, and **Development**:

| Variable | Required | Notes |
|----------|----------|-------|
| `VITE_GOOGLE_CLIENT_ID` | Yes | Google OAuth Web client ID |
| `VITE_SUPABASE_URL` | Yes | `https://xxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase publishable / anon key |
| `VITE_ADMIN_CODE` | Yes | Change from default — admin passcode |
| `OPENAI_API_KEY` | Later | Server-side only — enables GPT-4o mini mentor |

Do **not** prefix `OPENAI_API_KEY` with `VITE_` (keeps it server-side).

After adding vars, redeploy: **Deployments → … → Redeploy**.

---

## After first deploy

### Google OAuth — add production URL

1. Copy your Vercel URL (e.g. `https://zalife-daily-os.vercel.app`)
2. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → your OAuth client
3. **Authorized JavaScript origins** → add `https://your-app.vercel.app`
4. Save and wait ~1 minute

### Supabase

Run `supabase/schema.sql` in the Supabase SQL Editor if not done yet.

Optional: enable Realtime for `public_chat_messages` in Database → Replication.

### Test on production

- [ ] Google login works
- [ ] New user sees onboarding
- [ ] Tasks / calendar sync
- [ ] Skupinski klepet sends messages
- [ ] Admin at `/admin` with your passcode
- [ ] Mobile layout + AI mentor panel

---

## CLI deploy (alternative)

```bash
npx vercel login
npx vercel          # preview
npx vercel --prod   # production
```

Set env vars first:

```bash
npx vercel env add VITE_GOOGLE_CLIENT_ID
npx vercel env add VITE_SUPABASE_URL
npx vercel env add VITE_SUPABASE_ANON_KEY
npx vercel env add VITE_ADMIN_CODE
```

---

## What gets deployed

| Path | Type |
|------|------|
| `dist/` | Static SPA (Vite build) |
| `api/mentor.ts` | Serverless function → GPT-4o mini (needs `OPENAI_API_KEY`) |

`vercel.json` routes all non-`/api` paths to `index.html` for client-side routing.

---

## Custom domain (optional)

Vercel → Project → Settings → Domains → add your domain, then update Google OAuth origins.
