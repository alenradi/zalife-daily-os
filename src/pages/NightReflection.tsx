import { useState } from "react";
import { sl } from "../i18n/sl";
import { Card, PageHead } from "../components/ui";
import { LockScreen } from "../components/LockScreen";
import { GuardedInput, GuardedTextarea } from "../components/GuardedField";
import { useAppStore } from "../store/useAppStore";
import { todayISO, zonedHour, HOURS } from "../lib/date";

export function NightReflection() {
  const submitNight = useAppStore((s) => s.submitNight);
  const existing = useAppStore((s) => s.daily_logs[todayISO()]?.night);

  const [wins, setWins] = useState(["", "", ""]);
  const [note, setNote] = useState("");
  const [violation, setViolation] = useState(false);

  const locked = zonedHour() < HOURS.NIGHT_OPEN;

  if (locked) {
    return (
      <div className="page">
        <PageHead title={sl.night.title}>{sl.night.subtitle}</PageHead>
        <LockScreen
          title={sl.locks.nightTitle}
          message={sl.locks.nightMsg}
          opensAt="20:00"
        />
      </div>
    );
  }

  if (existing?.submitted) {
    return (
      <div className="page">
        <PageHead title={sl.night.title}>{sl.night.subtitle}</PageHead>
        <Card title={sl.night.doneTitle}>
          <div className="card-sub" style={{ marginBottom: 8 }}>
            {sl.night.winsTitle}
          </div>
          <ul style={{ paddingLeft: 18 }}>
            {existing.wins.map((w, i) => (
              <li key={i} style={{ marginBottom: 6 }}>
                {w}
              </li>
            ))}
          </ul>
          {existing.note && <p className="mt text-muted">„{existing.note}"</p>}
        </Card>
      </div>
    );
  }

  const winsFilled = wins.every((w) => w.trim().length > 1);
  const canSubmit = winsFilled && !violation;

  return (
    <div className="page">
      <PageHead title={sl.night.title}>{sl.night.subtitle}</PageHead>

      <Card title={sl.night.winsTitle} sub={sl.night.winsSub}>
        {wins.map((w, i) => (
          <div className="field" key={i}>
            <label>{i + 1}. zmaga</label>
            <GuardedInput
              value={w}
              placeholder={sl.night.winPlaceholder}
              onViolationChange={setViolation}
              onChange={(e) =>
                setWins((arr) => arr.map((x, j) => (j === i ? e.target.value : x)))
              }
            />
          </div>
        ))}
      </Card>

      <Card title={sl.night.reflectionTitle} className="mt">
        <div className="field">
          <GuardedTextarea
            rows={4}
            value={note}
            placeholder={sl.night.reflectionPlaceholder}
            onViolationChange={setViolation}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <div className="row between center mt">
          {!winsFilled ? (
            <span className="tag tag-gold">🔒 {sl.night.locked}</span>
          ) : violation ? (
            <span className="small text-crimson">{sl.ampak.blocked}</span>
          ) : (
            <span className="tag tag-teal">Pripravljeno za oddajo</span>
          )}
          <button
            className="btn btn-primary"
            disabled={!canSubmit}
            onClick={() =>
              submitNight({
                wins: [wins[0], wins[1], wins[2]],
                note,
              })
            }
          >
            {sl.night.submit}
          </button>
        </div>
      </Card>
    </div>
  );
}
