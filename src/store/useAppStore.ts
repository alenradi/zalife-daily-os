import { useMemo } from "react";
import { create } from "zustand";
import type {
  ChatMessage,
  DailyLog,
  IdentityChangeEntry,
  LifeStatus,
  MiddayCheckin,
  MorningPlan,
  NightReflection,
  PillarState,
  PlannerTask,
  SmartGoal,
  StudentRecord,
  UserProfile,
  WeeklyReset,
} from "../types";
import { XP_VALUES, levelFromXp, type XpEvent } from "../lib/xp";
import { todayISO, weekId, isoDaysAgo, lastNDates } from "../lib/date";
import { PILLARS } from "../data/pillars";
import { quoteForIndex, QUOTES } from "../data/quotes";
import {
  loadLegacySharedState,
  loadUserState,
  saveUserState,
} from "../lib/userStorage";

export type ModalKind =
  | "levelup"
  | "streak"
  | "drift"
  | "lock"
  | "celebrate"
  // proactive mindset reminder engine
  | "identity_check"
  | "deadline"
  // terminal night reflection summary
  | "daily_summary";

export interface ModalItem {
  id: string;
  kind: ModalKind;
  payload?: Record<string, unknown>;
}

const MAX_WARNINGS = 5;
const STREAK_MILESTONES = [3, 7, 12];

function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function emptyPillarState(): PillarState[] {
  return PILLARS.map((p) => ({
    pillar_id: p.id,
    metrics: p.metrics.map((m) => ({ key: m.key, value: 0, note: "" })),
    future_self_identity: "",
  }));
}

const DEFAULT_PURPOSE =
  "Moj smisel življenja, ki ga izumljam zase in za svoje življenje je, da so ljudje srečni in povezani.";
const DEFAULT_JAZ_SEM = "Motiviran, komunikativen, srečen, miren";

/** Sum of XP earned across the trailing 7 days (true weekly XP). */
function weeklyXpFromLogs(logs: Record<string, DailyLog>): number {
  return lastNDates(7).reduce((acc, d) => acc + (logs[d]?.xp_earned ?? 0), 0);
}

function migratePillars(pillars: PillarState[] | undefined): PillarState[] {
  const base = emptyPillarState();
  const existing = pillars ?? [];
  const oldFinance = existing.find((p) => p.pillar_id === "finance");
  return base.map((b) => {
    const prev =
      existing.find((p) => p.pillar_id === b.pillar_id) ??
      (b.pillar_id === "finance_career" && oldFinance
        ? {
            ...oldFinance,
            pillar_id: "finance_career",
            metrics: b.metrics.map((m) => {
              const old = oldFinance.metrics.find((x) => x.key === m.key);
              return old ? { ...m, ...old } : m;
            }),
          }
        : undefined);
    return prev
      ? { ...b, ...prev, future_self_identity: prev.future_self_identity ?? "" }
      : b;
  });
}

function buildUserState(
  userId: string,
  profilePatch: Partial<UserProfile> = {}
) {
  const profile: UserProfile = {
    user_id: userId,
    display_name: profilePatch.display_name ?? "Tvoje ime",
    age: profilePatch.age ?? 16,
    email: profilePatch.email ?? "",
    avatar_url: profilePatch.avatar_url ?? "",
    calendar_connected: profilePatch.calendar_connected ?? false,
    ...profilePatch,
  };
  return {
    profile,
    moj_smisel_zivljenja: DEFAULT_PURPOSE,
    jaz_sem_status: DEFAULT_JAZ_SEM,
    identity_locked: false,
    identity_editing: false,
    identity_change_log: [] as IdentityChangeEntry[],
    xp_points: 0,
    status: "FLOW" as LifeStatus,
    drift_warnings: 0,
    streak_days: 0,
    last_streak_date: null as string | null,
    system_locked: false,
    drift_handled_date: null as string | null,
    last_reminder_at: null as number | null,
    alerted_goals: {} as Record<string, string>,
    daily_logs: {} as Record<string, DailyLog>,
    weekly_resets: {} as Record<string, WeeklyReset>,
    next_week_unlocked: false,
    next_week_plan: "",
    goals: [] as SmartGoal[],
    pillars: emptyPillarState(),
    planner_tasks: {} as Record<string, PlannerTask[]>,
    recurring_tasks: [] as PlannerTask[],
    recurring_done: {} as Record<string, string[]>,
    chat: [] as ChatMessage[],
    modals: [] as ModalItem[],
    onboarding_completed: false,
  };
}

type UserDataSlice = ReturnType<typeof buildUserState>;

function mergeLoadedState(
  base: UserDataSlice,
  saved: Partial<AppState>,
  profilePatch: Partial<UserProfile>
): UserDataSlice {
  const merged = { ...base, ...saved };
  merged.profile = {
    ...base.profile,
    ...saved.profile,
    ...profilePatch,
    user_id: base.profile.user_id,
  };
  merged.pillars = migratePillars(saved.pillars);
  merged.modals = [];
  merged.identity_editing = false;
  merged.goals = (saved.goals ?? []).map((g) => ({
    ...g,
    identity_built: g.identity_built ?? "",
  }));
  if (saved.planner_tasks) {
    for (const date of Object.keys(saved.planner_tasks)) {
      merged.planner_tasks[date] = (saved.planner_tasks[date] ?? []).map((t) =>
        t.pillar_id === "finance" ? { ...t, pillar_id: "finance_career" } : t
      );
    }
  }
  if (saved.onboarding_completed === undefined) {
    const hasUsage =
      Object.keys(saved.daily_logs ?? {}).length > 0 ||
      (saved.xp_points ?? 0) > 0;
    merged.onboarding_completed = hasUsage;
  }
  const purpose = merged.moj_smisel_zivljenja ?? DEFAULT_PURPOSE;
  const jazSem = merged.jaz_sem_status ?? DEFAULT_JAZ_SEM;
  const isCustom =
    purpose.trim() !== DEFAULT_PURPOSE || jazSem.trim() !== DEFAULT_JAZ_SEM;
  if (isCustom && purpose.trim() && jazSem.trim() && !saved.identity_locked) {
    merged.identity_locked = true;
  }
  return merged;
}

export interface AppState {
  // ----- identity / progression (English schema) -----
  profile: UserProfile;
  // Dynamic purpose headers (editable on the dashboard). Field names are fixed
  // by product spec; their content is the Slovenian text the user authors.
  moj_smisel_zivljenja: string;
  jaz_sem_status: string;
  identity_locked: boolean;
  identity_editing: boolean;
  identity_change_log: IdentityChangeEntry[];
  xp_points: number;
  status: LifeStatus;
  drift_warnings: number;
  streak_days: number;
  last_streak_date: string | null;
  system_locked: boolean;
  // Day on which the user last recovered from Drift — prevents the watcher
  // from immediately re-triggering Drift for the same missed window.
  drift_handled_date: string | null;

  // ----- proactive reminder engine bookkeeping -----
  last_reminder_at: number | null; // epoch ms of the last reminder shown
  alerted_goals: Record<string, string>; // goalId -> ISO date last alerted

  // ----- daily + weekly data -----
  daily_logs: Record<string, DailyLog>;
  weekly_resets: Record<string, WeeklyReset>;
  next_week_unlocked: boolean;
  next_week_plan: string;

  // ----- growth -----
  goals: SmartGoal[];
  pillars: PillarState[];

  // ----- weekly execution-plan tasks -----
  planner_tasks: Record<string, PlannerTask[]>; // keyed by date ISO
  recurring_tasks: PlannerTask[]; // shown every day
  recurring_done: Record<string, string[]>; // date -> recurring task ids done

  // ----- ai -----
  chat: ChatMessage[];

  // ----- modal queue -----
  modals: ModalItem[];

  // ----- onboarding -----
  onboarding_completed: boolean;

  // ===== actions =====
  pushModal: (kind: ModalKind, payload?: Record<string, unknown>) => void;
  dismissModal: () => void;

  addXp: (event: XpEvent, multiplier?: number) => void;

  ensureToday: () => DailyLog;
  submitMorning: (data: Omit<MorningPlan, "date" | "submitted">) => void;
  toggleTask: (taskId: string) => void;
  submitMidday: (data: Omit<MiddayCheckin, "date" | "submitted">) => void;
  submitNight: (data: Omit<NightReflection, "date" | "submitted">) => void;

  setStatus: (s: LifeStatus) => void;
  triggerDrift: () => void;
  recoverFlow: () => void;

  // ----- identity-driven features -----
  updateIdentity: (patch: {
    moj_smisel_zivljenja?: string;
    jaz_sem_status?: string;
  }) => void;
  lockIdentity: () => void;
  unlockIdentityEdit: (reason: string) => void;
  commitIdentityChange: () => void;
  updatePillarIdentity: (pillarId: string, value: string) => void;
  awardIdentityAlignment: () => void;

  // ----- reminder engine -----
  noteReminderShown: () => void;
  markGoalAlerted: (goalId: string) => void;

  createGoal: (g: Omit<SmartGoal, "id" | "completed" | "created_at">) => void;
  completeGoal: (id: string) => void;
  deleteGoal: (id: string) => void;

  updatePillarMetric: (
    pillarId: string,
    key: string,
    patch: { value?: number; note?: string }
  ) => void;

  submitSundayReset: (
    data: Pick<
      WeeklyReset,
      "biggest_lesson" | "drift_reflection" | "honesty_rating"
    >
  ) => void;
  setNextWeekPlan: (plan: string) => void;

  addChatMessage: (m: ChatMessage) => void;
  updateProfile: (patch: Partial<UserProfile>) => void;
  connectCalendar: () => void;

  registerStreakDay: () => void;

  // ----- execution-plan task actions -----
  addPlannerTask: (
    dateISO: string,
    data: Omit<PlannerTask, "id" | "completed" | "created_at">
  ) => void;
  mergeCalendarTasksForDay: (
    dateISO: string,
    incoming: Omit<PlannerTask, "id" | "completed" | "created_at" | "recurring">[]
  ) => { added: number; skipped: number };
  togglePlannerTask: (dateISO: string, id: string, recurring: boolean) => void;
  deletePlannerTask: (dateISO: string, id: string, recurring: boolean) => void;

  completeOnboarding: () => void;

  /** Load or create isolated state for the signed-in user. */
  activateUser: (
    userId: string,
    profile: Partial<UserProfile>,
    opts?: { forceNew?: boolean }
  ) => void;
}

export const useAppStore = create<AppState>()((set, get) => {
  const guest = buildUserState("guest");

  return {
    ...guest,

    activateUser: (userId, profilePatch, opts) => {
      const prevId = get().profile.user_id;
      if (prevId && prevId !== userId && prevId !== "guest") {
        saveUserState(prevId, get());
      }

      const base = buildUserState(userId, profilePatch);
      let next: UserDataSlice = base;

      if (!opts?.forceNew) {
        const saved =
          loadUserState(userId) ?? loadLegacySharedState(userId);
        if (saved) {
          next = mergeLoadedState(base, saved, profilePatch);
        }
      }

      set({ ...get(), ...next, modals: [] });
      saveUserState(userId, get());
    },

    pushModal: (kind, payload) =>
        set((s) => ({
          modals: [...s.modals, { id: uid("modal"), kind, payload }],
        })),

      dismissModal: () =>
        set((s) => ({ modals: s.modals.slice(1) })),

      addXp: (event, multiplier = 1) => {
        const gain = XP_VALUES[event] * multiplier;
        const before = get().xp_points;
        const after = before + gain;
        const prevLevel = levelFromXp(before);
        const nextLevel = levelFromXp(after);
        const date = todayISO();
        // Keep the global total AND today's per-day ledger in sync so weekly
        // XP / leaderboard / summaries reflect reality (was previously lost).
        set((s) => {
          const log = s.daily_logs[date] ?? {
            date,
            xp_earned: 0,
            status: s.status,
          };
          return {
            xp_points: after,
            daily_logs: {
              ...s.daily_logs,
              [date]: { ...log, xp_earned: log.xp_earned + gain },
            },
          };
        });
        if (nextLevel > prevLevel) {
          get().pushModal("levelup", { level: nextLevel });
        }
      },

      ensureToday: () => {
        const date = todayISO();
        let log = get().daily_logs[date];
        if (!log) {
          log = { date, xp_earned: 0, status: get().status };
          set((s) => ({ daily_logs: { ...s.daily_logs, [date]: log! } }));
        }
        return log;
      },

      submitMorning: (data) => {
        const date = todayISO();
        const morning: MorningPlan = { ...data, date, submitted: true };
        set((s) => {
          const log = s.daily_logs[date] ?? {
            date,
            xp_earned: 0,
            status: s.status,
          };
          return {
            daily_logs: {
              ...s.daily_logs,
              [date]: { ...log, morning },
            },
          };
        });
        if (data.submitted_before_ten) {
          get().addXp("MORNING_PLAN_BEFORE_TEN");
        }
        get().registerStreakDay();
      },

      toggleTask: (taskId) => {
        const date = todayISO();
        const log = get().daily_logs[date];
        if (!log?.morning) return;
        let justCompleted = false;
        const top_tasks = log.morning.top_tasks.map((t) => {
          if (t.id === taskId) {
            const completed = !t.completed;
            if (completed) justCompleted = true;
            return { ...t, completed };
          }
          return t;
        });
        set((s) => ({
          daily_logs: {
            ...s.daily_logs,
            [date]: {
              ...log,
              morning: { ...log.morning!, top_tasks },
            },
          },
        }));
        if (justCompleted) get().addXp("TOP_PRIORITY_TASK");
      },

      submitMidday: (data) => {
        const date = todayISO();
        const midday: MiddayCheckin = { ...data, date, submitted: true };
        set((s) => {
          const log = s.daily_logs[date] ?? {
            date,
            xp_earned: 0,
            status: s.status,
          };
          return {
            daily_logs: { ...s.daily_logs, [date]: { ...log, midday } },
          };
        });
        get().addXp("MIDDAY_CHECKIN");
      },

      submitNight: (data) => {
        const date = todayISO();
        const night: NightReflection = { ...data, date, submitted: true };
        set((s) => {
          const log = s.daily_logs[date] ?? {
            date,
            xp_earned: 0,
            status: s.status,
          };
          return {
            daily_logs: { ...s.daily_logs, [date]: { ...log, night } },
          };
        });
        get().addXp("NIGHT_REFLECTION");
        get().registerStreakDay();

        // Terminal night summary: snapshot today's performance for the modal.
        const s = get();
        const xpToday = s.daily_logs[date]?.xp_earned ?? 0;
        const myWeekly = weeklyXpFromLogs(s.daily_logs);
        get().pushModal("daily_summary", {
          xpToday,
          weeklyXp: myWeekly,
          jazSem: s.jaz_sem_status,
          quote: quoteForIndex(Math.floor(Math.random() * QUOTES.length)),
        });
      },

      setStatus: (status) => set({ status }),

      triggerDrift: () => {
        if (get().status === "DRIFT") return;
        const warnings = Math.min(get().drift_warnings + 1, MAX_WARNINGS);
        const locked = warnings >= MAX_WARNINGS;
        set({ status: "DRIFT", drift_warnings: warnings, system_locked: locked });
        get().pushModal("drift", { warnings });
        if (locked) get().pushModal("lock");
      },

      recoverFlow: () => set({ status: "FLOW", drift_handled_date: todayISO() }),

      updateIdentity: (patch) => {
        const prev = get();
        set({ ...prev, ...patch });
        const s = get();
        const purpose = (patch.moj_smisel_zivljenja ?? s.moj_smisel_zivljenja).trim();
        const jazSem = (patch.jaz_sem_status ?? s.jaz_sem_status).trim();
        const isDefault =
          purpose === DEFAULT_PURPOSE && jazSem === DEFAULT_JAZ_SEM;
        if (
          !s.identity_locked &&
          !s.identity_editing &&
          purpose.length > 0 &&
          jazSem.length > 0 &&
          !isDefault
        ) {
          get().lockIdentity();
        }
      },

      lockIdentity: () =>
        set({ identity_locked: true, identity_editing: false }),

      unlockIdentityEdit: (reason) => {
        const s = get();
        set({
          identity_editing: true,
          identity_change_log: [
            {
              id: uid("ich"),
              changed_at: new Date().toISOString(),
              reason: reason.trim(),
              previous_purpose: s.moj_smisel_zivljenja,
              previous_jaz_sem: s.jaz_sem_status,
              new_purpose: "",
              new_jaz_sem: "",
            },
            ...s.identity_change_log,
          ],
        });
      },

      commitIdentityChange: () => {
        const s = get();
        const log = s.identity_change_log;
        if (log.length > 0 && s.identity_editing) {
          const entry = { ...log[0] };
          entry.new_purpose = s.moj_smisel_zivljenja;
          entry.new_jaz_sem = s.jaz_sem_status;
          set({
            identity_change_log: [entry, ...log.slice(1)],
            identity_locked: true,
            identity_editing: false,
          });
        } else {
          set({ identity_locked: true, identity_editing: false });
        }
      },

      updatePillarIdentity: (pillarId, value) =>
        set((s) => ({
          pillars: s.pillars.map((p) =>
            p.pillar_id === pillarId ? { ...p, future_self_identity: value } : p
          ),
        })),

      awardIdentityAlignment: () => {
        get().addXp("IDENTITY_ALIGNMENT");
        get().pushModal("celebrate", {
          title: "Usklajen z vizijo!",
          message:
            "Tvoja dejanja gradijo verzijo tebe, ki jo želiš postati. +40 XP",
        });
      },

      noteReminderShown: () => set({ last_reminder_at: Date.now() }),

      markGoalAlerted: (goalId) =>
        set((s) => ({
          alerted_goals: { ...s.alerted_goals, [goalId]: todayISO() },
        })),

      createGoal: (g) =>
        set((s) => ({
          goals: [
            {
              ...g,
              id: uid("goal"),
              completed: false,
              created_at: new Date().toISOString(),
            },
            ...s.goals,
          ],
        })),

      completeGoal: (id) => {
        const goal = get().goals.find((g) => g.id === id);
        if (!goal || goal.completed) return;
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === id
              ? { ...g, completed: true, completed_at: new Date().toISOString() }
              : g
          ),
        }));
        get().addXp("SMART_GOAL_COMPLETE");
        get().pushModal("celebrate", {
          title: "Cilj dosežen!",
          message: "Nagrada je odklenjena. To je vodenje v akciji. +500 XP",
        });
      },

      deleteGoal: (id) =>
        set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),

      updatePillarMetric: (pillarId, key, patch) =>
        set((s) => ({
          pillars: s.pillars.map((p) =>
            p.pillar_id === pillarId
              ? {
                  ...p,
                  metrics: p.metrics.map((m) =>
                    m.key === key ? { ...m, ...patch } : m
                  ),
                }
              : p
          ),
        })),

      submitSundayReset: (data) => {
        const wid = weekId();
        const logs = Object.values(get().daily_logs);
        const xp_earned_week = get().xp_points;
        const tasks_completed_week = logs.reduce(
          (acc, l) =>
            acc +
            (l.morning?.top_tasks.filter((t) => t.completed).length ?? 0),
          0
        );
        const activeDays = logs.filter(
          (l) => l.morning?.submitted || l.night?.submitted
        ).length;
        const consistency_score = Math.min(
          100,
          Math.round((activeDays / 7) * 100)
        );
        const reset: WeeklyReset = {
          week_id: wid,
          ...data,
          next_week_plan: "",
          xp_earned_week,
          tasks_completed_week,
          consistency_score,
          submitted: true,
          submitted_at: new Date().toISOString(),
        };
        set((s) => ({
          weekly_resets: { ...s.weekly_resets, [wid]: reset },
          next_week_unlocked: true,
        }));
        get().addXp("SUNDAY_RESET");
        get().pushModal("celebrate", {
          title: "Teden zaključen!",
          message:
            "Odklenil si načrtovanje naslednjega tedna. +300 XP. Nadaljuj rast.",
        });
      },

      setNextWeekPlan: (plan) => set({ next_week_plan: plan }),

      addChatMessage: (m) => set((s) => ({ chat: [...s.chat, m] })),

      updateProfile: (patch) =>
        set((s) => ({ profile: { ...s.profile, ...patch } })),

      connectCalendar: () =>
        set((s) => ({
          profile: { ...s.profile, calendar_connected: true },
        })),

      registerStreakDay: () => {
        const today = todayISO();
        const last = get().last_streak_date;
        if (last === today) return;
        const yesterday = isoDaysAgo(1);
        const streak = last === yesterday ? get().streak_days + 1 : 1;
        set({ streak_days: streak, last_streak_date: today });
        if (STREAK_MILESTONES.includes(streak)) {
          get().pushModal("streak", { days: streak });
        }
      },

      addPlannerTask: (dateISO, data) => {
        const task: PlannerTask = {
          ...data,
          id: uid("task"),
          completed: false,
          created_at: new Date().toISOString(),
        };
        if (data.recurring) {
          set((s) => ({ recurring_tasks: [...s.recurring_tasks, task] }));
        } else {
          set((s) => ({
            planner_tasks: {
              ...s.planner_tasks,
              [dateISO]: [...(s.planner_tasks[dateISO] ?? []), task],
            },
          }));
        }
      },

      mergeCalendarTasksForDay: (dateISO, incoming) => {
        const existing = get().planner_tasks[dateISO] ?? [];
        const calIds = new Set(
          existing.map((t) => t.calendar_event_id).filter(Boolean) as string[]
        );
        const titles = new Set(
          existing.map((t) => t.title.trim().toLowerCase())
        );
        let added = 0;
        let skipped = 0;
        const next = [...existing];

        for (const item of incoming) {
          if (item.calendar_event_id && calIds.has(item.calendar_event_id)) {
            skipped++;
            continue;
          }
          const normTitle = item.title.trim().toLowerCase();
          if (titles.has(normTitle)) {
            skipped++;
            continue;
          }
          const task: PlannerTask = {
            ...item,
            recurring: false,
            id: uid("task"),
            completed: false,
            created_at: new Date().toISOString(),
          };
          next.push(task);
          if (task.calendar_event_id) calIds.add(task.calendar_event_id);
          titles.add(normTitle);
          added++;
        }

        if (added > 0) {
          set((s) => ({
            planner_tasks: { ...s.planner_tasks, [dateISO]: next },
          }));
        }
        return { added, skipped };
      },

      togglePlannerTask: (dateISO, id, recurring) => {
        if (recurring) {
          const done = get().recurring_done[dateISO] ?? [];
          const isDone = done.includes(id);
          set((s) => ({
            recurring_done: {
              ...s.recurring_done,
              [dateISO]: isDone
                ? done.filter((x) => x !== id)
                : [...done, id],
            },
          }));
          if (!isDone) {
            const t = get().recurring_tasks.find((x) => x.id === id);
            get().addXp(t?.priority ? "TOP_PRIORITY_TASK" : "TASK_COMPLETE");
          }
          return;
        }
        const list = get().planner_tasks[dateISO] ?? [];
        let justCompleted = false;
        let wasPriority = false;
        const next = list.map((t) => {
          if (t.id === id) {
            const completed = !t.completed;
            if (completed) {
              justCompleted = true;
              wasPriority = t.priority;
            }
            return { ...t, completed };
          }
          return t;
        });
        set((s) => ({
          planner_tasks: { ...s.planner_tasks, [dateISO]: next },
        }));
        if (justCompleted) {
          get().addXp(wasPriority ? "TOP_PRIORITY_TASK" : "TASK_COMPLETE");
        }
      },

      deletePlannerTask: (dateISO, id, recurring) => {
        if (recurring) {
          set((s) => ({
            recurring_tasks: s.recurring_tasks.filter((t) => t.id !== id),
          }));
        } else {
          set((s) => ({
            planner_tasks: {
              ...s.planner_tasks,
              [dateISO]: (s.planner_tasks[dateISO] ?? []).filter(
                (t) => t.id !== id
              ),
            },
          }));
        }
      },

      completeOnboarding: () => set({ onboarding_completed: true }),
  };
});

/** Derive the live user's leaderboard record from current state. */
export function selectMyRecord(s: AppState): StudentRecord {
  const today = todayISO();
  const todayLog = s.daily_logs[today];
  return {
    user_id: s.profile.user_id,
    display_name: s.profile.display_name || "Jaz",
    avatar_url: s.profile.avatar_url,
    email: s.profile.email,
    status: s.status,
    xp_points: s.xp_points,
    level: levelFromXp(s.xp_points),
    weekly_xp: weeklyXpFromLogs(s.daily_logs),
    streak_days: s.streak_days,
    drift_warnings: s.drift_warnings,
    active_goals: s.goals.filter((g) => !g.completed).map((g) => g.specific),
    sunday_resets_completed: Object.keys(s.weekly_resets).length,
    locked: s.system_locked,
    moj_smisel_zivljenja: s.moj_smisel_zivljenja,
    jaz_sem_status: s.jaz_sem_status,
    identity_change_log: s.identity_change_log,
    calendar_connected: s.profile.calendar_connected,
    morning_submitted_today: !!todayLog?.morning?.submitted,
    midday_submitted_today: !!todayLog?.midday?.submitted,
    night_submitted_today: !!todayLog?.night?.submitted,
    goals_completed: s.goals.filter((g) => g.completed).length,
  };
}

/**
 * Hook variant: builds the live user's record from individually-selected
 * (stable) store slices and memoizes the object. Avoids the "getSnapshot
 * should be cached" loop caused by selecting a freshly-built object.
 */
export function useMyRecord(): StudentRecord {
  const xp = useAppStore((s) => s.xp_points);
  const status = useAppStore((s) => s.status);
  const streak = useAppStore((s) => s.streak_days);
  const warnings = useAppStore((s) => s.drift_warnings);
  const locked = useAppStore((s) => s.system_locked);
  const name = useAppStore((s) => s.profile.display_name);
  const avatar = useAppStore((s) => s.profile.avatar_url);
  const userId = useAppStore((s) => s.profile.user_id);
  const goals = useAppStore((s) => s.goals);
  const dailyLogs = useAppStore((s) => s.daily_logs);
  const resets = useAppStore((s) => s.weekly_resets);

  return useMemo<StudentRecord>(() => {
    const weekly = weeklyXpFromLogs(dailyLogs);
    return {
      user_id: userId,
      display_name: name || "Jaz",
      avatar_url: avatar,
      status,
      xp_points: xp,
      level: levelFromXp(xp),
      weekly_xp: weekly,
      streak_days: streak,
      drift_warnings: warnings,
      active_goals: goals.filter((g) => !g.completed).map((g) => g.specific),
      sunday_resets_completed: Object.keys(resets).length,
      locked,
    };
  }, [xp, status, streak, warnings, locked, name, avatar, userId, goals, dailyLogs, resets]);
}
