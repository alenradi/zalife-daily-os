import { useEffect, useRef } from "react";
import { pushUserSnapshot } from "../api/sync";
import { isCloudConfigured } from "../lib/supabase";
import { useAuthStore } from "../store/useAuthStore";
import { useAppStore } from "../store/useAppStore";

/**
 * Debounced cloud sync — pushes user data to Supabase after state changes.
 * Runs on login and every ~20s after the last local change.
 */
export function useCloudSync() {
  const userId = useAuthStore((s) => s.current_user_id);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!userId || !isCloudConfigured()) return;

    // Push immediately on login.
    void pushUserSnapshot();

    const unsub = useAppStore.subscribe(() => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        void pushUserSnapshot();
      }, 20_000);
    });

    return () => {
      unsub();
      if (timer.current) clearTimeout(timer.current);
    };
  }, [userId]);
}
