import { useEffect, useState } from "react";
import { sl } from "../i18n/sl";
import { useAppStore } from "../store/useAppStore";
import { levelProgress } from "../lib/xp";
import { formatClock, formatSlDate, zonedNow } from "../lib/date";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onMenu?: () => void;
}

export function Header({ title, subtitle, onMenu }: HeaderProps) {
  const xp = useAppStore((s) => s.xp_points);
  const status = useAppStore((s) => s.status);
  const prog = levelProgress(xp);

  const [now, setNow] = useState(() => zonedNow());
  useEffect(() => {
    const id = window.setInterval(() => setNow(zonedNow()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <header className="topbar">
      <button
        className="hamburger"
        onClick={onMenu}
        aria-label="Odpri meni"
        type="button"
      >
        <span />
        <span />
        <span />
      </button>
      <div className="topbar-title">
        <h1>{title}</h1>
        {subtitle && <div className="sub">{subtitle}</div>}
      </div>

      <div className="clock-chip">
        <div className="time">{formatClock(now)}</div>
        <div className="date">{formatSlDate(now)}</div>
      </div>

      <div className="topbar-spacer" />

      <div className="xp-chip">
        <div className="row between">
          <span className="lvl">
            {sl.common.level} {prog.level}
          </span>
          <span className="pts">
            {xp} {sl.common.xp}
          </span>
        </div>
        <div className="xp-track">
          <div className="xp-fill" style={{ width: `${prog.percent}%` }} />
        </div>
        <span className="pts small">
          {prog.intoLevel} / {prog.span} {sl.common.xp} {sl.common.of}{" "}
          {sl.common.level} {prog.level + 1}
        </span>
      </div>

      <div
        className={`status-pill ${status === "FLOW" ? "status-flow" : "status-drift"}`}
        title={status === "FLOW" ? sl.status.flowDesc : sl.status.driftDesc}
      >
        <span className="dot" />
        {status === "FLOW" ? sl.status.flow : sl.status.drift}
      </div>
    </header>
  );
}
