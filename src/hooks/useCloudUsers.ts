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
    const byId = new Map<string, StudentRecord>();
    for (const u of cloudUsers) byId.set(u.user_id, u);
    byId.set(me.user_id, { ...byId.get(me.user_id), ...me });
    return [...byId.values()];
  }, [cloudUsers, me]);

  return { all, loading, me };
}
