import { NavLink } from "react-router-dom";
import { sl } from "../i18n/sl";

interface MobileNavProps {
  onMore: () => void;
}

/** Fixed bottom navigation for phones. Most-used routes + a "more" drawer. */
export function MobileNav({ onMore }: MobileNavProps) {
  const items = [
    { to: "/", label: sl.nav.dashboard, icon: "◎" },
    { to: "/tasks", label: sl.nav.tasks, icon: "✓" },
    { to: "/morning", label: sl.nav.morning, icon: "☀" },
    { to: "/leaderboard", label: sl.nav.leaderboard, icon: "≣" },
  ];

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
