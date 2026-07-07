import { useEffect, useRef } from "react";
import { useAppStore } from "../store/useAppStore";

/**
 * Surfaces admin-issued XP notices as popups. Each unseen notice is shown once,
 * then marked seen (which persists locally and syncs back to the cloud so the
 * admin can tell the student acknowledged it).
 */
export function useAdminNotices() {
  const notices = useAppStore((s) => s.admin_xp_notices);
  const pushModal = useAppStore((s) => s.pushModal);
  const markSeen = useAppStore((s) => s.markAdminNoticesSeen);
  const shownRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const unseen = notices.filter(
      (n) => !n.seen && !shownRef.current.has(n.id)
    );
    if (unseen.length === 0) return;

    for (const n of unseen) {
      shownRef.current.add(n.id);
      pushModal("admin_xp", {
        mode: n.mode,
        amount: n.amount,
        reason: n.reason,
      });
    }
    markSeen(unseen.map((n) => n.id));
  }, [notices, pushModal, markSeen]);
}
