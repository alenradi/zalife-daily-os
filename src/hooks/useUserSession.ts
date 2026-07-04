import { useEffect, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useAppStore } from "../store/useAppStore";
import {
  cloudIsNewerThanLocal,
  fetchUserSnapshot,
} from "../api/sync";
import { isCloudConfigured } from "../lib/supabase";
import { hasUserState, saveUserState } from "../lib/userStorage";

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
    const account = useAuthStore.getState().currentAccount();
    if (!account) return;

    const forceNew = sessionStorage.getItem(FORCE_NEW_KEY) === userId;
    if (forceNew) sessionStorage.removeItem(FORCE_NEW_KEY);

    const hadLocalBefore = hasUserState(userId);

    useAppStore.getState().activateUser(
      userId,
      {
        display_name: account.name,
        email: account.email,
        avatar_url: account.picture ?? "",
      },
      { forceNew }
    );

    if (forceNew || !isCloudConfigured()) return;

    void (async () => {
      const cloud = await fetchUserSnapshot(userId);
      if (!cloud) return;
      if (
        !cloudIsNewerThanLocal(
          userId,
          cloud.updated_at,
          forceNew ? false : hadLocalBefore
        )
      ) {
        return;
      }
      useAppStore.getState().hydrateFromCloud(cloud);
    })();
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
