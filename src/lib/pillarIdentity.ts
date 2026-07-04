import type { PillarState } from "../types";

/** Identity for a pillar sub-area, with fallbacks to pillar-level and global jaz_sem. */
export function getSubAreaIdentity(
  pillars: PillarState[],
  pillarId: string,
  metricKey: string,
  fallbackJazSem: string
): string {
  const pillar = pillars.find((p) => p.pillar_id === pillarId);
  const metric = pillar?.metrics.find((m) => m.key === metricKey);
  if (metric?.jaz_sem?.trim()) return metric.jaz_sem.trim();
  if (pillar?.future_self_identity?.trim()) return pillar.future_self_identity.trim();
  return fallbackJazSem.trim();
}
