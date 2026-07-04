import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { sl } from "../i18n/sl";
import { dailyFlowNav } from "../lib/date";

interface MobileNavProps {
  onMore: () => void;
}

const PHASE_LABELS = {
  morning: sl.nav.morning,
  midday: sl.nav.midday,
  night: sl.nav.night,
} as const;

/** Fixed bottom navigation for phones. Most-used routes + a "more" drawer. */
export function MobileNav({ onMore }: MobileNavProps) {
  const [flowNav, setFlowNav] = useState(() => dailyFlowNav());

  useEffect(() => {
    setFlowNav(dailyFlowNav());
    const id = window.setInterval(() => setFlowNav(dailyFlowNav()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const items = useMemo(
    () => [
      { to: "/", label: sl.nav.dashboard, icon: "◎" },
      { to: "/tasks", label: sl.nav.tasks, icon: "✓" },
      {
        to: flowNav.to,
        label: PHASE_LABELS[flowNav.phase],
        icon: flowNav.icon,
      },
      { to: "/leaderboard", label: sl.nav.leaderboard, icon: "≣" },
    ],
    [flowNav]
  );

  return (
    <nav className="mobile-nav" aria-label={sl.nav.sectionDaily}>
      {items.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          end={it.to === "/"}
          className={({ isActive }) =>
            `mobile-nav-item ${isActive ? "active" : ""}`
          }
        >
          <span className="mn-ico">{it.icon}</span>
          <span className="mn-label">{it.label}</span>
        </NavLink>
      ))}
      <button className="mobile-nav-item" onClick={onMore} aria-label="Meni">
        <span className="mn-ico">☰</span>
        <span className="mn-label">Več</span>
      </button>
    </nav>
  );
}
