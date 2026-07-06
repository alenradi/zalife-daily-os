import { useEffect, useRef } from "react";
import { normalizeAuthSession, useAuthStore } from "../store/useAuthStore";
import { useAppStore } from "../store/useAppStore";
import {
  cloudIsNewerThanLocal,
  resolveCloudSnapshot,
  pushUserSnapshot,
  fetchUserSnapshotsByEmail,
  dedupeSnapshotsByEmail,
} from "../api/sync";
import { isCloudConfigured } from "../lib/supabase";
import { hasUserState, saveUserState, migrateUserStorage } from "../lib/userStorage";

const FORCE_NEW_KEY = "zalife-force-new";

/**
 * Activates the correct per-user app state on login, pulls cloud if newer,
 * and persists local changes.
 */
export function useUserSession() {
  const userId = useAuthStore((s) => s.current_user_id);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!userId) return;

    const boot = async () => {
      normalizeAuthSession();
      let uid = useAuthStore.getState().current_user_id;
      if (!uid) return;
      let account = useAuthStore.getState().currentAccount();
      if (!account) return;

      // Legacy Google session without sub — adopt stable g_ row from cloud if present.
      if (
        account.provider === "google" &&
        account.id.startsWith("u_") &&
        !account.google_sub &&
        isCloudConfigured()
      ) {
        const snaps = await fetchUserSnapshotsByEmail(account.email);
        const stable = dedupeSnapshotsByEmail(snaps).find((s) =>
          s.user_id.startsWith("g_")
        );
        if (stable && stable.user_id !== account.id) {
          migrateUserStorage(account.id, stable.user_id);
          useAuthStore.setState((s) => ({
            accounts: s.accounts
              .filter(
                (a) =>
                  !(
                    a.email === account!.email &&
                    a.provider === "google" &&
                    a.id !== stable.user_id
                  )
              )
              .map((a) =>
                a.id === account!.id ? { ...a, id: stable.user_id } : a
              ),
            current_user_id: stable.user_id,
          }));
          uid = stable.user_id;
          account = useAuthStore.getState().currentAccount()!;
        }
      }

      const forceNew = sessionStorage.getItem(FORCE_NEW_KEY) === uid;
      if (forceNew) sessionStorage.removeItem(FORCE_NEW_KEY);

      const hadLocalBefore = hasUserState(uid);

      useAppStore.getState().activateUser(
        uid,
        {
          display_name: account.name,
          email: account.email,
          avatar_url: account.picture ?? "",
        },
        { forceNew }
      );

      if (isCloudConfigured()) {
        const cloud = await resolveCloudSnapshot(uid, account.email);
        if (!cloud) {
          void pushUserSnapshot();
          return;
        }
        const app = useAppStore.getState();
        const shouldHydrate =
          forceNew ||
          cloudIsNewerThanLocal(uid, cloud.updated_at, hadLocalBefore) ||
          Number(cloud.data?.xp_points ?? 0) > app.xp_points ||
          (Boolean(cloud.data?.onboarding_completed) &&
            !app.onboarding_completed);

        if (shouldHydrate) {
          useAppStore.getState().hydrateFromCloud(cloud);
        }
        void pushUserSnapshot();
      }
    };

    void boot();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const unsub = useAppStore.subscribe(() => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        saveUserState(userId, useAppStore.getState());
      }, 400);
    });
    return () => {
      unsub();
      if (timer.current) clearTimeout(timer.current);
      saveUserState(userId, useAppStore.getState());
    };
  }, [userId]);
}

export function markFreshUserSession(userId: string) {
  sessionStorage.setItem(FORCE_NEW_KEY, userId);
}
