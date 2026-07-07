import { useAppStore } from "../store/useAppStore";
import { sl } from "../i18n/sl";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GuardedTextarea } from "./GuardedField";

const CONFETTI_COLORS = ["#EFA73B", "#F4CE86", "#FFB300", "#FFFFFF", "#D98E2B"];

function Confetti() {
  const pieces = Array.from({ length: 28 });
  return (
    <div className="confetti" aria-hidden>
      {pieces.map((_, i) => (
        <i
          key={i}
          style={{
            left: `${(i / pieces.length) * 100}%`,
            background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            animationDelay: `${(i % 9) * 0.18}s`,
            animationDuration: `${1.4 + (i % 5) * 0.3}s`,
          }}
        />
      ))}
    </div>
  );
}

export function ModalProvider() {
  const modals = useAppStore((s) => s.modals);
  const dismiss = useAppStore((s) => s.dismissModal);
  const recoverFlow = useAppStore((s) => s.recoverFlow);
  const awardIdentityAlignment = useAppStore((s) => s.awardIdentityAlignment);
  const [driftPlan, setDriftPlan] = useState("");
  const [driftViolation, setDriftViolation] = useState(false);
  const navigate = useNavigate();

  const current = modals[0];
  if (!current) return null;

  const close = () => dismiss();

  if (current.kind === "levelup") {
    const level = Number(current.payload?.level ?? 1);
    return (
      <div className="modal-overlay" onClick={close}>
        <div
          className="modal modal-levelup"
          style={{ position: "relative", overflow: "hidden" }}
          onClick={(e) => e.stopPropagation()}
        >
          <Confetti />
          <span className="modal-emoji">🚀</span>
          <h2>{sl.levelup.title}</h2>
          <p>{sl.levelup.msg(level)}</p>
          <div className="modal-actions">
            <button className="btn btn-primary" onClick={close}>
              {sl.common.continue}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (current.kind === "streak") {
    const days = Number(current.payload?.days ?? 3);
    return (
      <div className="modal-overlay" onClick={close}>
        <div
          className="modal modal-levelup"
          style={{ position: "relative", overflow: "hidden" }}
          onClick={(e) => e.stopPropagation()}
        >
          <Confetti />
          <span className="modal-emoji">🔥</span>
          <h2>{sl.streak.title(days)}</h2>
          <p>{sl.streak.msg(days)}</p>
          <div className="modal-actions">
            <button className="btn btn-primary" onClick={close}>
              {sl.common.continue}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (current.kind === "celebrate") {
    const title = String(current.payload?.title ?? "Čestitke!");
    const message = String(current.payload?.message ?? "");
    return (
      <div className="modal-overlay" onClick={close}>
        <div
          className="modal modal-levelup"
          style={{ position: "relative", overflow: "hidden" }}
          onClick={(e) => e.stopPropagation()}
        >
          <Confetti />
          <span className="modal-emoji">🏆</span>
          <h2>{title}</h2>
          <p>{message}</p>
          <div className="modal-actions">
            <button className="btn btn-primary" onClick={close}>
              {sl.common.continue}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (current.kind === "admin_xp") {
    const mode = String(current.payload?.mode ?? "add");
    const amount = Number(current.payload?.amount ?? 0);
    const reason = String(current.payload?.reason ?? "");
    const message =
      mode === "add"
        ? sl.adminXp.add(amount, reason)
        : mode === "remove"
          ? sl.adminXp.remove(amount, reason)
          : mode === "set"
            ? sl.adminXp.set(amount, reason)
            : sl.adminXp.reset(reason);
    const positive = mode === "add";
    return (
      <div className="modal-overlay">
        <div
          className="modal modal-levelup"
          style={{ position: "relative", overflow: "hidden" }}
          onClick={(e) => e.stopPropagation()}
        >
          <span className="modal-emoji">{positive ? "🎁" : "⚖️"}</span>
          <h2>{sl.adminXp.title}</h2>
          <p>{message}</p>
          <div className="modal-actions">
            <button className="btn btn-primary" onClick={close}>
              {sl.adminXp.ack}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (current.kind === "drift") {
    const warnings = Number(current.payload?.warnings ?? 1);
    return (
      <div className="modal-overlay">
        <div className="modal modal-warning" onClick={(e) => e.stopPropagation()}>
          <span className="modal-emoji">⚠️</span>
          <h2>{sl.drift.warnTitle}</h2>
          <p>{sl.drift.warnMsg}</p>
          <div className="warn-counter" aria-label={`${warnings}/5`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className={`pip ${i < warnings ? "on" : ""}`} />
            ))}
          </div>
          <p className="small text-gold">
            {sl.drift.warningCount} {warnings}/5
          </p>
          <div className="field" style={{ textAlign: "left", marginTop: 12 }}>
            <GuardedTextarea
              rows={3}
              placeholder={sl.drift.planPlaceholder}
              value={driftPlan}
              onViolationChange={setDriftViolation}
              onChange={(e) => setDriftPlan(e.target.value)}
            />
          </div>
          <div className="modal-actions">
            <button
              className="btn btn-gold"
              disabled={driftPlan.trim().length < 5 || driftViolation}
              onClick={() => {
                recoverFlow();
                setDriftPlan("");
                close();
              }}
            >
              {sl.drift.backToFlow}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (current.kind === "lock") {
    return (
      <div className="modal-overlay">
        <div className="modal modal-danger" onClick={(e) => e.stopPropagation()}>
          <span className="modal-emoji">🔒</span>
          <h2 className="text-crimson">{sl.drift.lockTitle}</h2>
          <p>{sl.drift.lockMsg}</p>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={close}>
              {sl.common.close}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (current.kind === "identity_check") {
    const vision = String(current.payload?.vision ?? "");
    const pillarTitle = String(current.payload?.pillarTitle ?? "");
    return (
      <div className="modal-overlay">
        <div className="modal modal-identity" onClick={(e) => e.stopPropagation()}>
          <span className="modal-emoji">🧭</span>
          <h2>{sl.reminder.identityTitle}</h2>
          {pillarTitle && (
            <div className="tag tag-teal" style={{ marginBottom: 12 }}>
              {sl.reminder.pillarTag}: {pillarTitle}
            </div>
          )}
          <p>{sl.reminder.identityQuestion(vision)}</p>
          <div className="modal-actions">
            <button
              className="btn btn-ghost"
              onClick={close}
            >
              {sl.reminder.notYet}
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                close();
                awardIdentityAlignment();
              }}
            >
              {sl.reminder.aligned}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (current.kind === "deadline") {
    const variant = String(current.payload?.variant ?? "goal");
    const isTask = variant === "task";
    const isPlanner = variant === "planner";
    const isCycle = variant === "cycle";
    const phase = String(current.payload?.phase ?? "morning");
    const title = String(current.payload?.title ?? "");
    const days = Number(current.payload?.days ?? 0);
    const tasks = (current.payload?.tasks as string[] | undefined) ?? [];
    const goalMsg =
      days < 0
        ? sl.reminder.deadlineGoalOverdue
        : days === 0
          ? sl.reminder.deadlineGoalToday
          : sl.reminder.deadlineGoalSoon(days);

    const heading = isPlanner
      ? sl.reminder.deadlinePlannerTitle
      : isCycle
        ? sl.reminder.cycleTitle(phase)
        : isTask
          ? sl.reminder.deadlineTaskTitle
          : sl.reminder.deadlineGoalTitle;

    const body = isPlanner
      ? sl.reminder.deadlinePlannerMsg
      : isCycle
        ? sl.reminder.cycleMsg(phase)
        : isTask
          ? sl.reminder.deadlineTaskMsg
          : goalMsg;

    const gotoPath = isPlanner || isTask
      ? "/tasks"
      : isCycle
        ? phase === "morning"
          ? "/morning"
          : phase === "midday"
            ? "/midday"
            : "/night"
        : "/goals";

    const gotoLabel = isPlanner || isTask
      ? sl.reminder.gotoTasks
      : isCycle
        ? sl.reminder.gotoCycle(phase)
        : sl.nav.goals;

    return (
      <div className="modal-overlay">
        <div className="modal modal-warning" onClick={(e) => e.stopPropagation()}>
          <span className="modal-emoji">⏳</span>
          <h2>{heading}</h2>
          {(isTask || isPlanner) && tasks.length > 0 ? (
            <>
              <p>{body}</p>
              <ul className="deadline-list">
                {tasks.slice(0, 4).map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </>
          ) : isCycle ? (
            <p>{body}</p>
          ) : (
            <>
              <p>{body}</p>
              {title && <p className="text-gold bold">„{title}"</p>}
            </>
          )}
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={close}>
              {sl.reminder.dismiss}
            </button>
            <button
              className="btn btn-gold"
              onClick={() => {
                close();
                navigate(gotoPath);
              }}
            >
              {gotoLabel}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (current.kind === "daily_summary") {
    const xpToday = Number(current.payload?.xpToday ?? 0);
    const weeklyXp = Number(current.payload?.weeklyXp ?? 0);
    const jazSem = String(current.payload?.jazSem ?? "");
    const quote = String(current.payload?.quote ?? "");
    return (
      <div className="modal-overlay">
        <div
          className="modal modal-summary"
          style={{ position: "relative", overflow: "hidden" }}
          onClick={(e) => e.stopPropagation()}
        >
          <Confetti />
          <span className="modal-emoji">🌙</span>
          <h2>{sl.summary.title}</h2>
          <p>{sl.summary.subtitle}</p>
          <div className="summary-stats">
            <div className="summary-stat">
              <div className="ss-k">{sl.summary.xpToday}</div>
              <div className="ss-v text-teal">+{xpToday}</div>
            </div>
            <div className="summary-stat">
              <div className="ss-k">{sl.leaderboard.byXp}</div>
              <div className="ss-v text-gold">{weeklyXp}</div>
            </div>
          </div>
          <div className="identity-mirror">
            {sl.summary.identityMirror(jazSem)}
          </div>
          {quote && <div className="summary-quote">„{quote}"</div>}
          <div className="modal-actions">
            <button className="btn btn-primary" onClick={close}>
              {sl.summary.close}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
