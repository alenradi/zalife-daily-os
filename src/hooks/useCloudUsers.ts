import { useEffect, useMemo, useState } from "react";
import {
  fetchAllUserSnapshots,
  snapshotToStudentRecord,
} from "../api/sync";
import { isCloudConfigured } from "../lib/supabase";
import { useMyRecord } from "../store/useAppStore";
import type { StudentRecord } from "../types";

/** Real users from Supabase + the live local session (no seed data). */
export function useCloudUsers() {
  const me = useMyRecord();
  const [cloudUsers, setCloudUsers] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isCloudConfigured()) {
      setCloudUsers([]);
      return;
    }
    setLoading(true);
    void fetchAllUserSnapshots()
      .then((snaps) => setCloudUsers(snaps.map(snapshotToStudentRecord)))
      .finally(() => setLoading(false));
  }, [me.user_id]);

  const all = useMemo(() => {
    const byEmail = new Map<string, StudentRecord>();
    for (const u of cloudUsers) {
      const key = u.email?.trim().toLowerCase();
      if (key) byEmail.set(key, u);
    }
    const meKey = me.email?.trim().toLowerCase();
    if (meKey) {
      byEmail.set(meKey, { ...byEmail.get(meKey), ...me, user_id: me.user_id });
    }
    return [...byEmail.values()];
  }, [cloudUsers, me]);

  return { all, loading, me };
}
