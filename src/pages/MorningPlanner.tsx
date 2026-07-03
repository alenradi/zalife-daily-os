import { useState } from "react";
import { sl } from "../i18n/sl";
import { Card, PageHead } from "../components/ui";
import { GuardedInput, GuardedTextarea } from "../components/GuardedField";
import { useAppStore } from "../store/useAppStore";
import { todayISO, zonedHour } from "../lib/date";
import { HOURS } from "../lib/date";
import { syncTasksToCalendar, canSyncCalendar } from "../api/calendar";
import type { Task } from "../types";

function newTask(): Task {
  return {
    id: `t_${Math.random().toString(36).slice(2, 8)}`,
    title: "",
    duration_minutes: 30,
    completed: false,
  };
}

export function MorningPlanner() {
  const submitMorning = useAppStore((s) => s.submitMorning);
  const toggleTask = useAppStore((s) => s.toggleTask);
  const existing = useAppStore((s) => s.daily_logs[todayISO()]?.morning);

  const calendarConnected = useAppStore((s) => s.profile.calendar_connected);
  const [gratitude, setGratitude] = useState<string[]>(["", "", ""]);
  const [tasks, setTasks] = useState<Task[]>([newTask(), newTask(), newTask()]);
  const [creator, setCreator] = useState("");
  const [feeling, setFeeling] = useState("");
  const [alignment, setAlignment] = useState("");
  const [violation, setViolation] = useState(false);
  const [syncNote, setSyncNote] = useState("");

  if (existing?.submitted) {
    return (
      <div className="page">
        <PageHead title={sl.morning.title}>{sl.morning.subtitle}</PageHead>
        <Card title={sl.morning.doneTitle} sub={sl.morning.doneSub}>
          <div className="card-sub" style={{ marginBottom: 10 }}>
            {sl.morning.gratitudeTitle}
          </div>
          <ul style={{ paddingLeft: 18, marginBottom: 18 }}>
            {existing.gratitude.map((g, i) => (
              <li key={i} style={{ marginBottom: 6 }}>
                {g}
              </li>
            ))}
          </ul>
          <div className="card-sub" style={{ marginBottom: 10 }}>
            {sl.morning.top3Title}
          </div>
          {existing.top_tasks.map((t) => (
            <div
              key={t.id}
              className={`task-row ${t.completed ? "done" : ""}`}
              onClick={() => toggleTask(t.id)}
              style={{ cursor: "pointer" }}
            >
              <div className={`checkbox ${t.completed ? "checked" : ""}`}>
                {t.completed ? "✓" : ""}
              </div>
              <span className="label">{t.title}</span>
              <span className="dur">
                {t.duration_minutes} {sl.common.minutes}
              </span>
            </div>
          ))}
          <p className="small text-teal mt">
            Odkljukaj zaključene naloge za +100 XP vsako.
          </p>
          {calendarConnected && (
            <p className="small text-muted mt-sm">
              📅 {syncNote || "Naloge so sinhronizirane z Google Koledarjem."}
            </p>
          )}
        </Card>

        {existing.identity_today && (
          <Card title={sl.morning.identityDoneTitle} className="mt">
            <div className="identity-recap">
              <div>
                <div className="card-sub">{sl.morning.creatorLabel}</div>
                <p>{existing.identity_today.creator}</p>
              </div>
              <div>
                <div className="card-sub">{sl.morning.feelingLabel}</div>
                <p>{existing.identity_today.feeling}</p>
              </div>
              <div>
                <div className="card-sub">{sl.morning.alignmentLabel}</div>
                <p>{existing.identity_today.goal_alignment}</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    );
  }

  const identityFilled =
    creator.trim().length > 2 &&
    feeling.trim().length > 2 &&
    alignment.trim().length > 2;

  const canSubmit =
    gratitude.every((g) => g.trim().length > 1) &&
    tasks.every((t) => t.title.trim().length > 1) &&
    identityFilled &&
    !violation;

  const submit = async () => {
    if (!canSubmit) return;
    const before10 = zonedHour() < HOURS.MORNING_BONUS_DEADLINE;
    submitMorning({
      gratitude: [gratitude[0], gratitude[1], gratitude[2]],
      top_tasks: tasks,
      identity_today: {
        creator: creator.trim(),
        feeling: feeling.trim(),
        goal_alignment: alignment.trim(),
      },
      submitted_before_ten: before10,
    });
    // Push the day's Top-3 tasks to Google Calendar if connected.
    if (canSyncCalendar()) {
      const res = await syncTasksToCalendar(tasks, todayISO(), 9, "morning");
      if (res.created > 0) setSyncNote(sl.profile.calendarSynced(res.created));
    } else if (calendarConnected) {
      setSyncNote(sl.profile.calendarTokenExpired);
    }
  };

  return (
    <div className="page">
      <PageHead title={sl.morning.title}>{sl.morning.subtitle}</PageHead>

      <div className="grid grid-2">
        <Card title={sl.morning.gratitudeTitle} sub={sl.morning.gratitudeSub}>
          {gratitude.map((g, i) => (
            <div className="field" key={i}>
              <label>
                {i + 1}. {sl.morning.gratitudeTitle}
              </label>
              <GuardedInput
                value={g}
                placeholder={sl.morning.gratitudePlaceholder}
                onViolationChange={setViolation}
                onChange={(e) =>
                  setGratitude((arr) =>
                    arr.map((x, j) => (j === i ? e.target.value : x))
                  )
                }
              />
            </div>
          ))}
        </Card>

        <Card title={sl.morning.top3Title} sub={sl.morning.top3Sub}>
          {tasks.map((t, i) => (
            <div className="field" key={t.id}>
              <label>
                {i + 1}. {sl.common.inProgress}
              </label>
              <div className="row gap-sm">
                <GuardedInput
                  value={t.title}
                  placeholder={sl.morning.taskPlaceholder}
                  className="flex1"
                  onViolationChange={setViolation}
                  onChange={(e) =>
                    setTasks((arr) =>
                      arr.map((x, j) =>
                        j === i ? { ...x, title: e.target.value } : x
                      )
                    )
                  }
                />
                <input
                  type="number"
                  min={5}
                  step={5}
                  className="input"
                  style={{ width: 92 }}
                  value={t.duration_minutes}
                  aria-label={sl.morning.durationPlaceholder}
                  onChange={(e) =>
                    setTasks((arr) =>
                      arr.map((x, j) =>
                        j === i
                          ? { ...x, duration_minutes: Number(e.target.value) }
                          : x
                      )
                    )
                  }
                />
              </div>
              <span className="hint">
                {sl.morning.durationPlaceholder} ({sl.common.minutes})
              </span>
            </div>
          ))}
        </Card>
      </div>

      <Card title={sl.morning.identityTitle} sub={sl.morning.identitySub} className="mt">
        <div className="field">
          <label>{sl.morning.creatorLabel}</label>
          <GuardedTextarea
            rows={2}
            value={creator}
            placeholder={sl.morning.creatorPlaceholder}
            onViolationChange={setViolation}
            onChange={(e) => setCreator(e.target.value)}
          />
        </div>
        <div className="field">
          <label>{sl.morning.feelingLabel}</label>
          <GuardedTextarea
            rows={2}
            value={feeling}
            placeholder={sl.morning.feelingPlaceholder}
            onViolationChange={setViolation}
            onChange={(e) => setFeeling(e.target.value)}
          />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>{sl.morning.alignmentLabel}</label>
          <GuardedTextarea
            rows={2}
            value={alignment}
            placeholder={sl.morning.alignmentPlaceholder}
            onViolationChange={setViolation}
            onChange={(e) => setAlignment(e.target.value)}
          />
        </div>
      </Card>

      <Card className="mt">
        <div className="row between center">
          <div>
            <div className="tag tag-teal">{sl.morning.beforeTenBonus}</div>
            {!identityFilled && (
              <p className="small text-muted mt-sm">
                🔒 {sl.morning.identitySub}
              </p>
            )}
            {violation && (
              <p className="small text-crimson mt-sm">{sl.ampak.blocked}</p>
            )}
          </div>
          <button
            className="btn btn-primary"
            disabled={!canSubmit}
            onClick={submit}
          >
            {sl.morning.submit}
          </button>
        </div>
      </Card>
    </div>
  );
}
