# ZaLife Daily OS 2.0

A desktop-first, gamified productivity **PWA** that transforms the ZaLife
Leadership Bootcamp lifecycle toolkit into a high-performance cockpit for
teenagers (ages 13–19).

- **UI language:** Slovenian (Slovenščina) — everything the user reads.
- **Engineering language:** English — schemas, variables, state machines, logs.

---

## Tech stack

| Layer        | Choice                                            |
| ------------ | ------------------------------------------------- |
| Framework    | React 19 + TypeScript + Vite 8                    |
| Routing      | react-router-dom                                  |
| State        | Zustand (with `persist` to `localStorage`)        |
| PWA          | vite-plugin-pwa (auto service worker + manifest)  |
| Styling      | Hand-built CSS design system (`src/styles`)       |

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production bundle -> dist/
npm run preview  # serve the built PWA
```

Optional integrations (see `.env.example`):

```bash
cp .env.example .env
# VITE_AI_ENDPOINT       -> real Claude 3.5 Haiku mentor backend
# VITE_GOOGLE_CLIENT_ID  -> Google sign-in + Calendar (one OAuth client)
# VITE_ADMIN_CODE        -> passcode for the /admin control room
```

Without these keys the app runs fully with a built-in mentor coaching stub and a
**demo** Google flow (fake account + logged calendar events).

### Enabling real Google sign-in & Calendar

1. In the [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   create an **OAuth 2.0 Web client**.
2. Add your origin (e.g. `http://localhost:5173`) to *Authorized JavaScript
   origins*.
3. Enable the **Google Calendar API** for the project.
4. Put the client id in `VITE_GOOGLE_CLIENT_ID`.

A single consent grants identity + `calendar.events`, so signing in with Google
also connects the calendar. Submitting the Morning Planner then pushes the
day's Top-3 tasks as timed events on the user's primary calendar.

## Accounts & access

- **Login / Signup** (`/login`): Google account or email+password (Gmail). Email
  accounts are stored locally (demo hash) — move to a backend for production.
- Every protected route redirects to `/login` when signed out; log out from the
  sidebar footer.
- **Admin control room** lives at **`/admin`** only — it is intentionally
  removed from the user navigation and protected by a passcode
  (`VITE_ADMIN_CODE`, default `ZALIFE-ADMIN-2026`).

---

## Core systems

### 1. Linguistic rule — "IN namesto AMPAK"
`GuardedInput` / `GuardedTextarea` (`src/components/GuardedField.tsx`) intercept
the word `ampak` on every keystroke, fire a shaking crimson toast, highlight the
field, and block submission until corrected. Regex: `src/lib/ampak.ts`.

### 2. Mapa Življenja
Four-pillar life matrix (`src/pages/MapaZivljenja.tsx`, data in
`src/data/pillars.ts`): Health, Relationships, Finance, Time — each with manual
0–100 ratings and notes, under the permanent Life Purpose identity banner.

### 3. Gamification
`src/lib/xp.ts` holds the XP economy and level curve. The Drift protocol
(`src/hooks/useDriftWatcher.ts`) drops the user from `FLOW` to `DRIFT` when the
midday check-in is missed past 14:00, issues `n/5` warnings, and locks the
account at 5/5.

### 4. Modal engine
`src/components/ModalProvider.tsx` is a global queued modal system: Level-Up,
Streak milestones (3/7/12), Drift warning (with recovery plan), system lock, and
celebration popups.

### 5. Daily & weekly pipeline
**Tasks** (weekly Execution Plan board) → Morning Planner → Midday Check-In →
Night Reflection → **Sunday Reset**.

The whole app runs on a **fixed GMT+2 clock** (`src/lib/date.ts`, live in the
header). Time-gated features:
- Midday Check-In unlocks at **12:00**
- Night Reflection unlocks at **20:00**

A clearly-marked **TEST: odkleni** button (top-right) bypasses these locks for
testing. Remove it for production: delete the `bypass-btn` block in
`src/components/Header.tsx` and the `test_bypass` slice in
`src/store/useAppStore.ts`.

On Sunday the regular OS is frozen until the weekly reflection is logged, which
then unlocks Next-Week Planning.

### 6. SMART Goals
`src/pages/Goals.tsx` enforces Specific / Measurable / Achievable / Relatable /
Time-relevant fields plus a reward image that stays behind a translucent mesh
overlay until the goal is completed (+500 XP).

### 7. AI Mentor
`src/api/ai.ts` — ZaLife Leadership Coach persona (direct, accountable, Slovene),
context-aware of Flow/Drift, streaks and incomplete priorities. Placeholder hook
ready for a Claude 3.5 Haiku backend.

### 8. Leaderboard & Admin
`src/pages/Leaderboard.tsx` ranks the cohort by weekly XP / streak and features a
**secret award** banner with a live countdown to the bootcamp finale
(**10.7.2026**); the mystery reward reveals the winner once the timer ends.
`src/pages/AdminGate.tsx` is the passcode-gated super-admin control room at
`/admin` (state, XP/level, warnings, active goals, resets).

### 9. Auth, Profile & integrations
`src/store/useAuthStore.ts` + `src/pages/Login.tsx` handle Google / email auth.
`src/lib/google.ts` runs the GIS OAuth token flow; `src/api/calendar.ts` connects
the calendar with one button and syncs daily tasks as events. Profile holds
avatar upload, details, and the calendar connection status.

---

## Project structure

```
src/
├── api/        # AI + calendar placeholder hooks
├── components/ # shell, modals, guarded inputs, ui primitives
├── data/       # pillars, quotes, seed roster
├── hooks/      # drift watcher
├── i18n/       # Slovenian string registry
├── lib/        # xp, drift dates, ampak regex
├── pages/      # all routes
├── store/      # zustand store (English schema)
└── styles/     # global design system
```

## Brand tokens

Font: **Open Sans** throughout. Palette (from brand reference): charcoal base
`#15171C`/`#1B1E24` · surface `#2A2E37` · slate `#565D6E` · amber accent
`#EFA73B`/`#D98E2B` · cream `#F4CE86` · white/silver `#FFFFFF`/`#CDD0D6` · vivid
gold drift `#FFB300` · crimson violation `#FF3333`. Logo: `public/logo.png`.
