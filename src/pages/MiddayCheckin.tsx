import { useState } from "react";
import { sl } from "../i18n/sl";
import { Card, PageHead } from "../components/ui";
import { LockScreen } from "../components/LockScreen";
import { useAppStore } from "../store/useAppStore";
import { todayISO, dayPhase, pastMiddayDeadline, zonedHour, HOURS } from "../lib/date";

function Slider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="field">
      <label className="row between" style={{ display: "flex" }}>
        <span>{label}</span>
        <span className="text-teal bold">{value}%</span>
      </label>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        className="slider"
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

export function MiddayCheckin() {
  const submitMidday = useAppStore((s) => s.submitMidday);
  const today = useAppStore((s) => s.daily_logs[todayISO()]);
  const toggleTask = useAppStore((s) => s.toggleTask);

  const [mood, setMood] = useState(60);
  const [energy, setEnergy] = useState(60);
  const [focus, setFocus] = useState(60);

  const morningTasks = today?.morning?.top_tasks ?? [];
  const doneCount = morningTasks.filter((t) => t.completed).length;
  const planCompletion =
    morningTasks.length > 0
      ? Math.round((doneCount / morningTasks.length) * 100)
      : 0;

  const existing = today?.midday;
  const late = pastMiddayDeadline();
  const phase = dayPhase();
  const locked = zonedHour() < HOURS.MIDDAY_OPEN;

  if (locked) {
    return (
      <div className="page">
        <PageHead title={sl.midday.title}>{sl.midday.subtitle}</PageHead>
        <LockScreen
          title={sl.locks.middayTitle}
          message={sl.locks.middayMsg}
          opensAt="12:00"
        />
      </div>
    );
  }

  if (existing?.submitted) {
    return (
      <div className="page">
        <PageHead title={sl.midday.title}>{sl.midday.subtitle}</PageHead>
        <Card title={sl.midday.doneTitle}>
          <div className="grid grid-3">
            <div className="stat">
              <div className="k">{sl.midday.moodTitle}</div>
              <div className="v teal">{existing.mood}%</div>
            </div>
            <div className="stat">
              <div className="k">{sl.midday.energyTitle}</div>
              <div className="v teal">{existing.energy}%</div>
            </div>
            <div className="stat">
              <div className="k">{sl.midday.focusTitle}</div>
              <div className="v teal">{existing.focus}%</div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="page">
      <PageHead title={sl.midday.title}>{sl.midday.subtitle}</PageHead>

      <div className="row between center" style={{ marginBottom: 16 }}>
        <span className="tag tag-teal">{sl.midday.window}</span>
        {late && <span className="tag tag-gold">⚠ {sl.midday.deadlineWarn}</span>}
        {phase !== "midday" && phase !== "afternoon" && (
          <span className="tag">Predogled izven okna</span>
        )}
      </div>

      <div className="grid grid-2">
        <Card title={sl.midday.moodTitle}>
          <Slider label={sl.midday.moodTitle} value={mood} onChange={setMood} />
          <Slider
            label={sl.midday.energyTitle}
            value={energy}
            onChange={setEnergy}
          />
          <Slider
            label={sl.midday.focusTitle}
            value={focus}
            onChange={setFocus}
          />
        </Card>

        <Card title={sl.midday.progressTitle} sub={sl.midday.progressSub}>
          {morningTasks.length === 0 ? (
            <p className="text-muted small">
              Najprej oddaj jutranji plan, da vidiš naloge.
            </p>
          ) : (
            <>
              {morningTasks.map((t) => (
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
              <div className="pbar mt">
                <span style={{ width: `${planCompletion}%` }} />
              </div>
              <p className="small text-teal mt-sm">
                {planCompletion}% jutranjega plana opravljeno
              </p>
            </>
          )}
        </Card>
      </div>

      <Card className="mt">
        <div className="row between center">
          <span className="card-sub">{sl.midday.window}</span>
          <button
            className="btn btn-primary"
            onClick={() =>
              submitMidday({
                mood,
                energy,
                focus,
                plan_completion: planCompletion,
              })
            }
          >
            {sl.midday.submit}
          </button>
        </div>
      </Card>
    </div>
  );
}
