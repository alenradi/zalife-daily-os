import { useCallback, useEffect, useMemo, useState } from "react";
import { sl } from "../i18n/sl";
import { Card, EmptyState, PageHead } from "../components/ui";
import { GuardedInput } from "../components/GuardedField";
import { useAppStore } from "../store/useAppStore";
import {
  importCalendarDay,
  syncPlannerDayToCalendar,
  syncTasksToCalendar,
  canSyncCalendar,
} from "../api/calendar";
import { PILLARS } from "../data/pillars";
import {
  SL_DAYS_SHORT,
  formatSlDate,
  todayISO,
  weekDates,
  zonedNow,
} from "../lib/date";
import type { PlannerTask } from "../types";

const DURATIONS = [15, 30, 45, 60, 90, 120];

/** Build the enforced identity-driven task title from its structured parts. */
function composeTaskTitle(
  pillarTitle: string,
  trait: string,
  description: string
): string {
  return `${sl.tasks.prefixSemNa} ${pillarTitle} — ${trait.trim()} — ${sl.tasks.prefixZato} ${description.trim()}`;
}

export function Tasks() {
  const planner = useAppStore((s) => s.planner_tasks);
  const dailyLogs = useAppStore((s) => s.daily_logs);
  const recurring = useAppStore((s) => s.recurring_tasks);
  const recurringDone = useAppStore((s) => s.recurring_done);
  const addTask = useAppStore((s) => s.addPlannerTask);
  const toggleTask = useAppStore((s) => s.togglePlannerTask);
  const toggleMorningTask = useAppStore((s) => s.toggleTask);
  const deleteTask = useAppStore((s) => s.deletePlannerTask);
  const calendarConnected = useAppStore((s) => s.profile.calendar_connected);
  const calendarReady = canSyncCalendar();

  const today = todayISO();
  const [selected, setSelected] = useState(today);
  const [weekOffset, setWeekOffset] = useState(0);
  const weekRef = useMemo(() => {
    const d = zonedNow();
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  }, [weekOffset]);
  const week = useMemo(() => weekDates(weekRef), [weekRef]);

  const [pillarId, setPillarId] = useState("");
  const [trait, setTrait] = useState("");
  const [desc, setDesc] = useState("");
  const [priority, setPriority] = useState(false);
  const [recurringFlag, setRecurringFlag] = useState(false);
  const [duration, setDuration] = useState(30);
  const [traitViolation, setTraitViolation] = useState(false);
  const [descViolation, setDescViolation] = useState(false);
  const [syncNote, setSyncNote] = useState("");
  const [syncError, setSyncError] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [pulling, setPulling] = useState(false);

  const violation = traitViolation || descViolation;
  const selectedPillar = PILLARS.find((p) => p.id === pillarId);

  const selDate = new Date(selected + "T00:00:00");

  const oneOff = planner[selected] ?? [];
  const doneIds = recurringDone[selected] ?? [];
  const morningTop3 = dailyLogs[selected]?.morning?.top_tasks ?? [];

  type TaskRow = PlannerTask & {
    isRecurring: boolean;
    done: boolean;
    isTop3?: boolean;
  };

  const top3Rows: TaskRow[] = morningTop3.map((t) => ({
    id: t.id,
    title: t.title,
    duration_minutes: t.duration_minutes,
    priority: true,
    recurring: false,
    completed: t.completed,
    created_at: "",
    isRecurring: false,
    done: t.completed,
    isTop3: true,
  }));

  const list: TaskRow[] = [
    ...top3Rows,
    ...recurring.map((t) => ({
      ...t,
      isRecurring: true,
      done: doneIds.includes(t.id),
    })),
    ...oneOff.map((t) => ({ ...t, isRecurring: false, done: t.completed })),
  ];
  list.sort((a, b) => {
    if (a.isTop3 !== b.isTop3) return a.isTop3 ? -1 : 1;
    return Number(b.priority) - Number(a.priority);
  });

  const canAdd =
    !!selectedPillar &&
    trait.trim().length > 1 &&
    desc.trim().length > 1 &&
    !violation;

  const chooseWeekOffset = (offset: number) => {
    const bounded = Math.max(-52, Math.min(52, offset));
    const ref = zonedNow();
    ref.setDate(ref.getDate() + bounded * 7);
    const nextWeek = weekDates(ref);
    const sameWeekday = (zonedNow().getDay() + 6) % 7;
    setWeekOffset(bounded);
    setSelected(nextWeek[sameWeekday]?.iso ?? nextWeek[0].iso);
  };

  const pullFromCalendar = useCallback(
    async (quiet = false) => {
      if (!canSyncCalendar()) {
        if (!quiet) setSyncError(sl.tasks.calendarReconnectNeeded);
        return;
      }
      setPulling(true);
      if (!quiet) {
        setSyncError("");
        setSyncNote("");
      }
      const res = await importCalendarDay(selected);
      if (!quiet) {
        if (res.imported > 0) setSyncNote(sl.tasks.pullFromCalendarDone(res.imported));
        else if (!res.needsReconnect) setSyncNote(sl.tasks.pullFromCalendarDone(0));
        else setSyncError(sl.tasks.calendarReconnectNeeded);
      }
      setPulling(false);
    },
    [selected]
  );

  // Auto-import calendar events when the selected day changes.
  useEffect(() => {
    if (!calendarReady) return;
    void pullFromCalendar(true);
  }, [selected, calendarReady, pullFromCalendar]);

  const submit = async () => {
    if (!canAdd || !selectedPillar) return;
    const composed = composeTaskTitle(selectedPillar.title, trait, desc);
    addTask(selected, {
      title: composed,
      duration_minutes: duration,
      priority,
      recurring: recurringFlag,
      pillar_id: selectedPillar.id,
      identity_trait: trait.trim(),
      task_description: desc.trim(),
    });
    setSyncError("");
    if (calendarReady) {
      const res = await syncTasksToCalendar(
        [
          {
            id: `tmp_${Date.now()}`,
            title: composed,
            duration_minutes: duration,
            completed: false,
          },
        ],
        selected,
        9,
        "tasks"
      );
      if (res.created > 0) setSyncNote(sl.tasks.syncedToCalendar);
      else if (res.needsReconnect) setSyncError(sl.tasks.calendarReconnectNeeded);
    } else if (calendarConnected) {
      setSyncError(sl.tasks.calendarReconnectNeeded);
    }
    setPillarId("");
    setTrait("");
    setDesc("");
    setPriority(false);
    setRecurringFlag(false);
    setDuration(30);
  };

  const syncDay = async () => {
    setSyncing(true);
    setSyncError("");
    setSyncNote("");
    const openTasks = list.filter((t) => !t.done);
    if (openTasks.length === 0) {
      setSyncNote(sl.tasks.syncDayNone);
      setSyncing(false);
      return;
    }
    if (!calendarReady) {
      setSyncError(sl.tasks.calendarReconnectNeeded);
      setSyncing(false);
      return;
    }
    const res = await syncPlannerDayToCalendar(
      openTasks.map((t) => ({
        id: t.id,
        title: t.title,
        duration_minutes: t.duration_minutes,
        priority: t.priority,
        recurring: t.isRecurring,
        completed: t.done,
        created_at: t.created_at,
      })),
      selected
    );
    if (res.created > 0) setSyncNote(sl.tasks.syncDayDone(res.created));
    else if (res.needsReconnect) setSyncError(sl.tasks.calendarReconnectNeeded);
    else if (res.failed > 0) setSyncError(sl.tasks.calendarReconnectNeeded);
    setSyncing(false);
  };

  return (
    <div className="page">
      <PageHead title={sl.tasks.title}>{sl.tasks.subtitle}</PageHead>

      <Card>
        <div className="row between center" style={{ marginBottom: 18 }}>
          <h3>{sl.tasks.executionPlan}</h3>
          <div className="row gap-sm center">
            <span className="text-muted small">{formatSlDate(selDate)}</span>
            {(calendarConnected || calendarReady) && (
              <>
                <button
                  className="btn btn-ghost btn-sm"
                  disabled={pulling}
                  onClick={() => pullFromCalendar(false)}
                  type="button"
                >
                  ↓ {pulling ? sl.auth.connecting : sl.tasks.pullFromCalendar}
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  disabled={syncing}
                  onClick={syncDay}
                  type="button"
                >
                  ↑ {syncing ? sl.auth.connecting : sl.tasks.syncDay}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="week-slider-row">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => chooseWeekOffset(weekOffset - 1)}
          >
            ← Prejšnji teden
          </button>
          <div className="week-slider-wrap">
            <div className="row between center">
              <span className="small text-muted">
                {weekOffset === 0
                  ? "Ta teden"
                  : weekOffset > 0
                    ? `${weekOffset} ted. naprej`
                    : `${Math.abs(weekOffset)} ted. nazaj`}
              </span>
              <button className="week-today-btn" onClick={() => chooseWeekOffset(0)}>
                Danes
              </button>
            </div>
            <input
              className="slider week-slider"
              type="range"
              min="-52"
              max="52"
              value={weekOffset}
              onChange={(e) => chooseWeekOffset(Number(e.target.value))}
              aria-label="Izberi teden"
            />
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => chooseWeekOffset(weekOffset + 1)}
          >
            Naslednji teden →
          </button>
        </div>

        <div className="week-tabs">
          {week.map((d) => (
            <button
              key={d.iso}
              className={`week-tab ${d.iso === selected ? "active" : ""}`}
              onClick={() => setSelected(d.iso)}
            >
              <span className="wt-day">{SL_DAYS_SHORT[d.dayIndex]}</span>
              <span className="wt-date">{Number(d.iso.slice(8, 10))}</span>
              {d.iso === today && <span className="wt-dot" />}
            </button>
          ))}
        </div>

        <div className="identity-task-builder">
          <p className="itb-intro">✦ {sl.tasks.identityIntro}</p>
          <div className="itb-template">
            <span className="itb-frag">{sl.tasks.prefixSemNa}</span>
            <select
              className="input itb-pillar"
              value={pillarId}
              onChange={(e) => setPillarId(e.target.value)}
              aria-label={sl.tasks.pillarSelect}
            >
              <option value="">{sl.tasks.pillarSelectPlaceholder}</option>
              {PILLARS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
            <GuardedInput
              className="itb-trait"
              value={trait}
              placeholder={sl.tasks.traitPlaceholder}
              onViolationChange={setTraitViolation}
              onChange={(e) => setTrait(e.target.value)}
            />
            <span className="itb-frag">{sl.tasks.prefixZato}</span>
            <GuardedInput
              className="itb-desc"
              value={desc}
              placeholder={sl.tasks.addPlaceholder}
              onViolationChange={setDescViolation}
              onChange={(e) => setDesc(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
            />
            <button
              className="btn btn-primary itb-add"
              disabled={!canAdd}
              onClick={submit}
            >
              + {sl.tasks.add}
            </button>
          </div>
          {!selectedPillar && (
            <p className="small text-muted itb-hint">{sl.tasks.needPillar}</p>
          )}
          {selectedPillar && trait.trim() && desc.trim() && !violation && (
            <p className="small text-teal itb-preview">
              „{composeTaskTitle(selectedPillar.title, trait, desc)}"
            </p>
          )}
          {violation && (
            <p className="small text-crimson itb-hint">{sl.ampak.blocked}</p>
          )}
        </div>

        <div className="add-task-opts">
          <label className="opt-check">
            <input
              type="checkbox"
              checked={priority}
              onChange={(e) => setPriority(e.target.checked)}
            />
            <span className={priority ? "text-accent bold" : ""}>
              ⚡ {sl.tasks.priority}
            </span>
          </label>
          <label className="opt-check">
            <input
              type="checkbox"
              checked={recurringFlag}
              onChange={(e) => setRecurringFlag(e.target.checked)}
            />
            <span>↻ {sl.tasks.recurring}</span>
          </label>
          <label className="opt-check">
            <span className="text-muted">{sl.tasks.duration}:</span>
            <select
              className="input"
              style={{ width: "auto", padding: "6px 10px" }}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            >
              {DURATIONS.map((d) => (
                <option key={d} value={d}>
                  {d}m
                </option>
              ))}
            </select>
          </label>
          {syncNote && (
            <span className="small text-teal">📅 {syncNote}</span>
          )}
          {syncError && (
            <span className="small text-crimson">⚠ {syncError}</span>
          )}
        </div>
      </Card>

      <div style={{ marginTop: 20 }}>
        {list.length === 0 ? (
          <EmptyState>{sl.tasks.empty}</EmptyState>
        ) : (
          list.map((t) => (
            <div
              key={t.id}
              className={`exec-row ${t.done ? "done" : ""} ${
                t.priority ? "priority" : ""
              }`}
            >
              <button
                className={`checkbox ${t.done ? "checked" : ""}`}
                onClick={() =>
                  t.isTop3
                    ? toggleMorningTask(t.id)
                    : toggleTask(selected, t.id, t.isRecurring)
                }
              >
                {t.done ? "✓" : ""}
              </button>
              <div className="flex1">
                <div className="exec-title">{t.title}</div>
                <div className="exec-meta">
                  {t.isTop3 && (
                    <span className="exec-top3">{sl.tasks.top3Tag}</span>
                  )}
                  {t.priority && !t.isTop3 && (
                    <span className="exec-prio">{sl.tasks.priorityTag}</span>
                  )}
                  <span className="text-muted">{t.duration_minutes}m</span>
                  {t.isRecurring && (
                    <span className="text-muted">• {sl.tasks.dailyTag}</span>
                  )}
                  {t.from_calendar && (
                    <span className="exec-cal">{sl.tasks.calendarTag}</span>
                  )}
                  {t.isTop3 && (
                    <span className="text-muted">• {sl.tasks.top3Source}</span>
                  )}
                </div>
              </div>
              {!t.isTop3 && (
                <button
                  className="exec-del"
                  title={sl.common.delete}
                  onClick={() => deleteTask(selected, t.id, t.isRecurring)}
                >
                  ✕
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
