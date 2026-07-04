import { useCallback, useEffect, useMemo, useState } from "react";
import { sl } from "../i18n/sl";
import { Card, EmptyState, PageHead } from "../components/ui";
import {
  TaskEditorModal,
  composeTaskTitle,
  type TaskEditorValues,
} from "../components/TaskEditorModal";
import { useAppStore } from "../store/useAppStore";
import {
  importCalendarDay,
  syncPlannerDayToCalendar,
  syncPlannerTaskToCalendar,
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
import {
  defaultSlotForDay,
  durationFromRange,
  formatTimeRange,
  sortKeyForTask,
} from "../lib/taskTime";
import type { PlannerTask } from "../types";
import { getSubAreaIdentity } from "../lib/pillarIdentity";

export function Tasks() {
  const planner = useAppStore((s) => s.planner_tasks);
  const pillars = useAppStore((s) => s.pillars);
  const jazSem = useAppStore((s) => s.jaz_sem_status);
  const dailyLogs = useAppStore((s) => s.daily_logs);
  const recurring = useAppStore((s) => s.recurring_tasks);
  const recurringDone = useAppStore((s) => s.recurring_done);
  const addTask = useAppStore((s) => s.addPlannerTask);
  const updateTask = useAppStore((s) => s.updatePlannerTask);
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

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<PlannerTask | null>(null);
  const [syncNote, setSyncNote] = useState("");
  const [syncError, setSyncError] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [pulling, setPulling] = useState(false);

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
  ].sort((a, b) => sortKeyForTask(a) - sortKeyForTask(b));

  const existingStarts = list
    .map((t) => t.start_time)
    .filter(Boolean) as string[];
  const defaultSlot = defaultSlotForDay(existingStarts, 60);

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
        const total = res.imported + res.updated;
        if (total > 0) setSyncNote(sl.tasks.pullFromCalendarDone(total));
        else if (!res.needsReconnect) setSyncNote(sl.tasks.pullFromCalendarDone(0));
        else setSyncError(sl.tasks.calendarReconnectNeeded);
      }
      setPulling(false);
    },
    [selected]
  );

  useEffect(() => {
    if (!calendarReady) return;
    void pullFromCalendar(true);
  }, [selected, calendarReady, pullFromCalendar]);

  const openNewEditor = () => {
    setEditing(null);
    setEditorOpen(true);
  };

  const openEdit = (t: PlannerTask & { isRecurring: boolean; isTop3?: boolean }) => {
    if (t.isTop3) return;
    setEditing(t);
    setEditorOpen(true);
  };

  const buildTaskPayload = (values: TaskEditorValues) => {
    const identity = getSubAreaIdentity(
      pillars,
      values.pillar_id,
      values.pillar_metric_key,
      jazSem
    );
    const duration = durationFromRange(values.start_time, values.end_time);
    const title = composeTaskTitle(
      values.pillar_id,
      values.pillar_metric_key,
      identity,
      values.task_description
    );
    return {
      title,
      duration_minutes: duration,
      start_time: values.start_time,
      end_time: values.end_time,
      priority: values.priority,
      recurring: values.recurring,
      pillar_id: values.pillar_id,
      pillar_metric_key: values.pillar_metric_key,
      identity_trait: identity,
      task_description: values.task_description.trim(),
    };
  };

  const saveTask = async (values: TaskEditorValues) => {
    setSyncError("");
    const payload = buildTaskPayload(values);

    if (editing) {
      updateTask(selected, editing.id, payload, editing.recurring);
      const merged = { ...editing, ...payload };
      if (calendarReady && !editing.from_calendar) {
        const res = await syncPlannerTaskToCalendar(merged, selected);
        if (res.ok) setSyncNote(sl.tasks.syncedToCalendar);
        else if (res.needsReconnect) setSyncError(sl.tasks.calendarReconnectNeeded);
      }
    } else {
      const id = addTask(selected, payload);
      const created = { ...payload, id, completed: false, created_at: "", recurring: values.recurring };
      if (calendarReady) {
        const res = await syncPlannerTaskToCalendar(created as PlannerTask, selected);
        if (res.ok) setSyncNote(sl.tasks.syncedToCalendar);
        else if (res.needsReconnect) setSyncError(sl.tasks.calendarReconnectNeeded);
      } else if (calendarConnected) {
        setSyncError(sl.tasks.calendarReconnectNeeded);
      }
    }
    setEditorOpen(false);
    setEditing(null);
  };

  const syncDay = async () => {
    setSyncing(true);
    setSyncError("");
    setSyncNote("");
    const openTasks = list.filter((t) => !t.done && !t.isTop3);
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
        start_time: t.start_time,
        end_time: t.end_time,
        priority: t.priority,
        recurring: t.isRecurring,
        completed: t.done,
        created_at: t.created_at,
        calendar_event_id: t.calendar_event_id,
        from_calendar: t.from_calendar,
      })),
      selected
    );
    const total = res.created + res.updated;
    if (total > 0) setSyncNote(sl.tasks.syncDayDone(total));
    else if (res.needsReconnect) setSyncError(sl.tasks.calendarReconnectNeeded);
    setSyncing(false);
  };

  const editorInitial: TaskEditorValues = editing
    ? {
        pillar_id: editing.pillar_id ?? "",
        pillar_metric_key: editing.pillar_metric_key ?? "",
        task_description: editing.task_description ?? editing.title,
        start_time: editing.start_time ?? defaultSlot.start,
        end_time: editing.end_time ?? defaultSlot.end,
        priority: editing.priority,
        recurring: editing.recurring,
      }
    : {
        pillar_id: "",
        pillar_metric_key: "",
        task_description: "",
        start_time: defaultSlot.start,
        end_time: defaultSlot.end,
        priority: false,
        recurring: false,
      };

  return (
    <div className="page">
      <PageHead title={sl.tasks.title}>{sl.tasks.subtitle}</PageHead>

      <Card>
        <div className="row between center" style={{ marginBottom: 18 }}>
          <h3>{sl.tasks.dayOverview}</h3>
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
          <p className="itb-intro">✦ {sl.tasks.identityIntroMapa}</p>
          <button className="btn btn-primary" type="button" onClick={openNewEditor}>
            + {sl.tasks.addTask}
          </button>
          {(syncNote || syncError) && (
            <div className="add-task-opts" style={{ marginTop: 12 }}>
              {syncNote && <span className="small text-teal">📅 {syncNote}</span>}
              {syncError && <span className="small text-crimson">⚠ {syncError}</span>}
            </div>
          )}
        </div>
      </Card>

      <div className="task-timeline" style={{ marginTop: 20 }}>
        {list.length === 0 ? (
          <EmptyState>{sl.tasks.empty}</EmptyState>
        ) : (
          list.map((t) => {
            const timeLabel = formatTimeRange(t.start_time, t.end_time);
            const pillarTitle = t.pillar_id
              ? PILLARS.find((p) => p.id === t.pillar_id)?.title
              : null;
            return (
              <div
                key={t.id}
                className={`exec-row task-timeline-row ${t.done ? "done" : ""} ${
                  t.priority ? "priority" : ""
                }`}
              >
                <div className="task-time-col">
                  {timeLabel ? (
                    <>
                      <span className="task-time-start">{t.start_time}</span>
                      <span className="task-time-end">{t.end_time}</span>
                    </>
                  ) : (
                    <span className="task-time-na">{t.duration_minutes}m</span>
                  )}
                </div>
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
                <button
                  className="flex1 task-row-body"
                  type="button"
                  onClick={() => openEdit(t)}
                  disabled={!!t.isTop3}
                >
                  <div className="exec-title">{t.title}</div>
                  <div className="exec-meta">
                    {t.isTop3 && (
                      <span className="exec-top3">{sl.tasks.top3Tag}</span>
                    )}
                    {t.priority && !t.isTop3 && (
                      <span className="exec-prio">{sl.tasks.priorityTag}</span>
                    )}
                    {pillarTitle && (
                      <span className="text-muted">• {pillarTitle}</span>
                    )}
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
                </button>
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
            );
          })
        )}
      </div>

      {editorOpen && (
        <TaskEditorModal
          dateISO={selected}
          task={editing ?? undefined}
          initial={editorInitial}
          onSave={(v) => void saveTask(v)}
          onClose={() => {
            setEditorOpen(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
