/**
 * Google Identity Services (GIS) integration.
 *
 * Browser-side OAuth2 token flow used for BOTH sign-in and Google Calendar.
 * Requires `VITE_GOOGLE_CLIENT_ID` (a Google Cloud OAuth Web client id with
 * the app origin registered under "Authorized JavaScript origins").
 *
 * Demo mode only runs in local dev when the client id is missing.
 * Production builds must set VITE_GOOGLE_CLIENT_ID at build time (Vercel env).
 */

const CLIENT_ID = (
  import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
)?.trim();

const DEMO_ALLOWED =
  import.meta.env.DEV && import.meta.env.VITE_GOOGLE_DEMO !== "0";

// One consent covers identity + calendar so the user grants everything once.
const SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/calendar.events",
].join(" ");

export interface GoogleToken {
  access_token: string;
  expires_at: number; // epoch ms
}

export interface GoogleUser {
  sub: string;
  email: string;
  name: string;
  picture: string;
}

export function isGoogleConfigured(): boolean {
  return typeof CLIENT_ID === "string" && CLIENT_ID.length > 0;
}

// ---- GIS script loader ----------------------------------------------------

declare global {
  interface Window {
    google?: any;
  }
}

let gisPromise: Promise<void> | null = null;

function loadGis(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (gisPromise) return gisPromise;
  gisPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Identity Services failed to load"));
    document.head.appendChild(script);
  });
  return gisPromise;
}

// ---- Token request (consent popup) ----------------------------------------

export async function requestGoogleAccess(): Promise<GoogleToken> {
  if (!isGoogleConfigured()) {
    if (DEMO_ALLOWED) {
      // Local dev only — never on Vercel/production.
      await new Promise((r) => setTimeout(r, 700));
      return {
        access_token: `demo_token_${Math.random().toString(36).slice(2)}`,
        expires_at: Date.now() + 3600_000,
      };
    }
    throw new Error(
      "google_not_configured: VITE_GOOGLE_CLIENT_ID manjka. Na Vercel dodaj env spremenljivko in ponovno objavi."
    );
  }

  await loadGis();
  return new Promise<GoogleToken>((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (resp: any) => {
        if (resp.error) {
          const code = String(resp.error);
          const detail = String(resp.error_description || resp.error);
          reject(
            new Error(
              code === "invalid_client"
                ? "invalid_client: OAuth client not found — check Google Cloud Console (Web application client)."
                : detail
            )
          );
          return;
        }
        resolve({
          access_token: resp.access_token,
          expires_at: Date.now() + (resp.expires_in ?? 3600) * 1000,
        });
      },
    });
    client.requestAccessToken({ prompt: "consent" });
  });
}

// ---- Profile fetch --------------------------------------------------------

export async function fetchGoogleUser(token: string): Promise<GoogleUser> {
  if (token.startsWith("demo_token_")) {
    return {
      sub: "demo-google-user",
      email: "demo@gmail.com",
      name: "Demo Voditelj",
      picture: "",
    };
  }
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Google userinfo failed: ${res.status}`);
  return res.json();
}

// ---- Calendar event creation ----------------------------------------------

export interface CalendarEventInput {
  summary: string;
  description?: string;
  startISO: string;
  endISO: string;
}

export async function createCalendarEvent(
  token: string,
  event: CalendarEventInput
): Promise<{ id: string; htmlLink?: string }> {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const body = {
    summary: event.summary,
    description: event.description,
    start: { dateTime: event.startISO, timeZone: tz },
    end: { dateTime: event.endISO, timeZone: tz },
    reminders: { useDefault: true },
    colorId: "6", // tangerine, matches the brand amber
  };

  if (token.startsWith("demo_token_")) {
    // DEMO mode: log instead of hitting the API.
    console.log("[calendar:demo] create event", body);
    await new Promise((r) => setTimeout(r, 200));
    return { id: `demo_evt_${Math.random().toString(36).slice(2, 9)}` };
  }

  const res = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) throw new Error(`Calendar insert failed: ${res.status}`);
  return res.json();
}

export async function updateCalendarEvent(
  token: string,
  eventId: string,
  event: CalendarEventInput
): Promise<{ id: string }> {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const body = {
    summary: event.summary,
    description: event.description,
    start: { dateTime: event.startISO, timeZone: tz },
    end: { dateTime: event.endISO, timeZone: tz },
  };

  if (token.startsWith("demo_token_")) {
    console.log("[calendar:demo] update event", eventId, body);
    await new Promise((r) => setTimeout(r, 200));
    return { id: eventId };
  }

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) throw new Error(`Calendar update failed: ${res.status}`);
  return res.json();
}

// ---- Calendar event listing (import) --------------------------------------

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  status?: string;
}

/** List timed + all-day events on the primary calendar for a date range. */
export async function listCalendarEvents(
  token: string,
  timeMin: string,
  timeMax: string
): Promise<GoogleCalendarEvent[]> {
  if (token.startsWith("demo_token_")) {
    await new Promise((r) => setTimeout(r, 300));
    const day = timeMin.slice(0, 10);
    return [
      {
        id: "demo_evt_1",
        summary: "🔥 Demo naloga iz koledarja",
        start: { dateTime: `${day}T10:00:00+02:00` },
        end: { dateTime: `${day}T10:30:00+02:00` },
        status: "confirmed",
      },
    ];
  }

  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "50",
  });

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Calendar list failed: ${res.status}`);
  const data = (await res.json()) as { items?: GoogleCalendarEvent[] };
  return (data.items ?? []).filter((e) => e.status !== "cancelled");
}
