import { useState } from "react";
import { sl } from "../i18n/sl";
import { Card, PageHead, StatTile } from "../components/ui";
import { GuardedTextarea } from "../components/GuardedField";
import { useAppStore } from "../store/useAppStore";
import { isSundayResetOpen, weekId, lastNDates } from "../lib/date";
import { LockScreen } from "../components/LockScreen";

export function SundayReset() {
  const store = useAppStore();
  const reset = store.weekly_resets[weekId()];
  const submitReset = store.submitSundayReset;
  const setPlan = store.setNextWeekPlan;

  const [lesson, setLesson] = useState("");
  const [drift, setDrift] = useState("");
  const [rating, setRating] = useState(7);
  const [violation, setViolation] = useState(false);
  const [planText, setPlanText] = useState(store.next_week_plan);
  const [planViolation, setPlanViolation] = useState(false);

  // Aggregate last-7-day metrics for the summary.
  const last7 = lastNDates(7);
  const tasksCompleted = last7.reduce(
    (acc, d) =>
      acc +
      (store.daily_logs[d]?.morning?.top_tasks.filter((t) => t.completed)
        .length ?? 0),
    0
  );
  const activeDays = last7.filter(
    (d) =>
      store.daily_logs[d]?.morning?.submitted ||
      store.daily_logs[d]?.night?.submitted
  ).length;
  const consistency = Math.round((activeDays / 7) * 100);

  const submitted = !!reset?.submitted;
  const canSubmit = lesson.trim().length > 3 && drift.trim().length > 3 && !violation;
  const locked = !isSundayResetOpen();

  if (locked) {
    return (
      <div className="page">
        <PageHead title={sl.sunday.title}>{sl.sunday.subtitle}</PageHead>
        <LockScreen
          title={sl.sunday.lockedTitle}
          message={sl.sunday.lockedMsg}
          opensAt="18:00 (nedelja)"
        />
      </div>
    );
  }

  const Summary = (
    <div className="grid grid-3" style={{ marginBottom: 20 }}>
      <StatTile k={sl.sunday.xpEarned} v={store.xp_points} tone="teal" />
      <StatTile k={sl.sunday.tasksCompleted} v={tasksCompleted} />
      <StatTile k={sl.sunday.consistencyScore} v={`${consistency}%`} tone="gold" />
    </div>
  );

  return (
    <div className="page">
      <PageHead title={sl.sunday.title}>{sl.sunday.subtitle}</PageHead>

      {isSundayResetOpen() && !submitted && (
        <div className="lock-banner">
          <span className="lk">🔒</span>
          <div>
            <b>Nedelja</b>
            <div className="small">{sl.sunday.lockMsg}</div>
          </div>
        </div>
      )}

      <Card title={sl.sunday.summaryTitle}>{Summary}</Card>

      {!submitted ? (
        <Card title={sl.sunday.title} className="mt">
          <div className="field">
            <label>{sl.sunday.lessonLabel}</label>
            <GuardedTextarea
              rows={3}
              value={lesson}
              placeholder={sl.sunday.lessonPlaceholder}
              onViolationChange={setViolation}
              onChange={(e) => setLesson(e.target.value)}
            />
          </div>
          <div className="field">
            <label>{sl.sunday.driftLabel}</label>
            <GuardedTextarea
              rows={3}
              value={drift}
              placeholder={sl.sunday.driftPlaceholder}
              onViolationChange={setViolation}
              onChange={(e) => setDrift(e.target.value)}
            />
          </div>
          <div className="field">
            <label className="row between" style={{ display: "flex" }}>
              <span>{sl.sunday.ratingLabel}</span>
              <span className="text-teal bold">{rating}/10</span>
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={rating}
              className="slider"
              onChange={(e) => setRating(Number(e.target.value))}
            />
          </div>
          {violation && <p className="small text-crimson">{sl.ampak.blocked}</p>}
          <button
            className="btn btn-primary btn-block mt"
            disabled={!canSubmit}
            onClick={() =>
              submitReset({
                biggest_lesson: lesson,
                drift_reflection: drift,
                honesty_rating: rating,
              })
            }
          >
            {sl.sunday.submit}
          </button>
        </Card>
      ) : (
        <Card
          title={sl.sunday.planningTitle}
          sub={sl.sunday.planningSub}
          className="mt"
        >
          <div className="tag tag-teal" style={{ marginBottom: 14 }}>
            ✓ {sl.sunday.finishTitle} {sl.sunday.finishMsg}
          </div>
          <div className="field">
            <GuardedTextarea
              rows={6}
              value={planText}
              placeholder={sl.sunday.planPlaceholder}
              onViolationChange={setPlanViolation}
              onChange={(e) => {
                setPlanText(e.target.value);
                setPlan(e.target.value);
              }}
            />
          </div>
          {planViolation && (
            <p className="small text-crimson">{sl.ampak.blocked}</p>
          )}
          <p className="small text-muted">
            {sl.sunday.lessonLabel}: „{reset?.biggest_lesson}"
          </p>
        </Card>
      )}
    </div>
  );
}
