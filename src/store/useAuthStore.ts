import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GoogleToken } from "../lib/google";
import { migrateUserStorage } from "../lib/userStorage";

/**
 * Authentication store. Frontend-only:
 *  - Email/password accounts are kept locally (passwords stored as a light
 *    hash; a real deployment must move this to a backend).
 *  - Google accounts authenticate via Google Identity Services.
 */

export type AuthProvider = "email" | "google";

export interface Account {
  id: string;
  name: string;
  email: string;
  provider: AuthProvider;
  password_hash?: string;
  picture?: string;
  /** Google account subject — used for stable cross-device id. */
  google_sub?: string;
}

interface AuthResult {
  ok: boolean;
  error?: string;
}

interface AuthState {
  accounts: Account[];
  current_user_id: string | null;
  google_token: GoogleToken | null;

  signupEmail: (name: string, email: string, password: string) => AuthResult;
  loginEmail: (email: string, password: string) => AuthResult;
  loginWithGoogle: (
    user: { sub: string; email: string; name: string; picture: string },
    token: GoogleToken
  ) => { account: Account; created: boolean };
  setGoogleToken: (token: GoogleToken) => void;
  logout: () => void;

  currentAccount: () => Account | null;
  hasValidGoogleToken: () => boolean;
}

// Lightweight non-cryptographic hash (demo only — replace with server auth).
function hash(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) h = (h * 33) ^ input.charCodeAt(i);
  return (h >>> 0).toString(36);
}

// uid() removed — use stableGoogleId / stableEmailId for cross-device identity.
export function stableGoogleId(sub: string): string {
  return `g_${sub}`;
}

/** Stable id for email/password accounts. */
export function stableEmailId(email: string): string {
  return `e_${hash(email.trim().toLowerCase())}`;
}

/** Resolve the canonical user id (migrates legacy random ids). */
export function canonicalUserId(account: Account): string {
  if (account.provider === "google") {
    if (account.google_sub) return stableGoogleId(account.google_sub);
    const stable = useAuthStore
      .getState()
      .accounts.find(
        (a) =>
          a.provider === "google" &&
          a.email === account.email &&
          a.id.startsWith("g_")
      );
    if (stable) return stable.id;
  }
  if (account.provider === "email") return stableEmailId(account.email);
  return account.id;
}

/**
 * Normalize persisted session to stable ids so cloud sync does not fork rows.
 * Call on every app load before activating user state.
 */
export function normalizeAuthSession(): string | null {
  const state = useAuthStore.getState();
  const account = state.currentAccount();
  if (!account) return null;

  const canonical = canonicalUserId(account);
  if (canonical === account.id) return canonical;

  migrateUserStorage(account.id, canonical);

  const accounts = state.accounts
    .filter(
      (a) =>
        !(
          a.email === account.email &&
          a.provider === account.provider &&
          a.id !== canonical
        )
    )
    .map((a) =>
      a.id === account.id
        ? { ...a, id: canonical, google_sub: account.google_sub ?? a.google_sub }
        : a
    );

  useAuthStore.setState({ accounts, current_user_id: canonical });
  return canonical;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accounts: [],
      current_user_id: null,
      google_token: null,

      signupEmail: (name, email, password) => {
        const cleanEmail = email.trim().toLowerCase();
        if (!name.trim()) return { ok: false, error: "Vnesi svoje ime." };
        if (!EMAIL_RE.test(cleanEmail))
          return { ok: false, error: "Neveljaven e-poštni naslov." };
        if (password.length < 6)
          return { ok: false, error: "Geslo mora imeti vsaj 6 znakov." };
        if (get().accounts.some((a) => a.email === cleanEmail))
          return { ok: false, error: "Ta e-pošta je že registrirana." };

        const account: Account = {
          id: stableEmailId(cleanEmail),
          name: name.trim(),
          email: cleanEmail,
          provider: "email",
          password_hash: hash(password),
        };
        set((s) => ({
          accounts: [...s.accounts, account],
          current_user_id: account.id,
        }));
        return { ok: true };
      },

      loginEmail: (email, password) => {
        const cleanEmail = email.trim().toLowerCase();
        const account = get().accounts.find(
          (a) => a.email === cleanEmail && a.provider === "email"
        );
        if (!account) return { ok: false, error: "Račun ne obstaja." };
        if (account.password_hash !== hash(password))
          return { ok: false, error: "Napačno geslo." };
        const canonical = stableEmailId(cleanEmail);
        if (account.id !== canonical) {
          migrateUserStorage(account.id, canonical);
          set((s) => ({
            accounts: s.accounts.map((a) =>
              a.id === account!.id ? { ...a, id: canonical } : a
            ),
            current_user_id: canonical,
          }));
        } else {
          set({ current_user_id: account.id });
        }
        return { ok: true };
      },

      loginWithGoogle: (user, token) => {
        const email = user.email.trim().toLowerCase();
        const stableId = stableGoogleId(user.sub);
        let created = false;

        let account =
          get().accounts.find((a) => a.id === stableId) ?? null;

        if (!account) {
          const legacy = get().accounts.find(
            (a) => a.email === email && a.provider === "google"
          );
          if (legacy) {
            if (legacy.id !== stableId) {
              migrateUserStorage(legacy.id, stableId);
            }
            account = {
              ...legacy,
              id: stableId,
              google_sub: user.sub,
              name: user.name || legacy.name,
              picture: user.picture || legacy.picture,
            };
            set((s) => ({
              accounts: s.accounts.map((a) =>
                a.id === legacy.id ? account! : a
              ),
            }));
          }
        }

        if (!account) {
          created = true;
          account = {
            id: stableId,
            name: user.name || email.split("@")[0],
            email,
            provider: "google",
            picture: user.picture,
            google_sub: user.sub,
          };
          set((s) => ({ accounts: [...s.accounts, account!] }));
        } else if (!created) {
          const updated = {
            ...account,
            google_sub: user.sub,
            name: user.name || account.name,
            picture: user.picture || account.picture,
          };
          set((s) => ({
            accounts: s.accounts.map((a) =>
              a.id === stableId ? updated : a
            ),
          }));
          account = updated;
        }

        set({ current_user_id: account.id, google_token: token });
        return { account, created };
      },

      setGoogleToken: (token) => set({ google_token: token }),

      logout: () =>
        set({ current_user_id: null, google_token: null }),

      currentAccount: () => {
        const { accounts, current_user_id } = get();
        return accounts.find((a) => a.id === current_user_id) ?? null;
      },

      hasValidGoogleToken: () => {
        const t = get().google_token;
        return !!t && t.expires_at > Date.now() + 30_000;
      },
    }),
    { name: "zalife-auth-v1", version: 2 }
  )
);
