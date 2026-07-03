import { NavLink, useNavigate } from "react-router-dom";
import { sl } from "../i18n/sl";
import { saveUserState } from "../lib/userStorage";
import { useAppStore } from "../store/useAppStore";
import { useAuthStore } from "../store/useAuthStore";

interface NavDef {
  to: string;
  label: string;
  icon: string;
  alert?: boolean;
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const status = useAppStore((s) => s.status);
  const drift = status === "DRIFT";
  const navigate = useNavigate();
  const account = useAuthStore((s) => s.currentAccount());
  const logout = useAuthStore((s) => s.logout);

  const onLogout = () => {
    onNavigate?.();
    const userId = useAppStore.getState().profile.user_id;
    if (userId && userId !== "guest") {
      saveUserState(userId, useAppStore.getState());
    }
    logout();
    navigate("/login");
  };

  const daily: NavDef[] = [
    { to: "/", label: sl.nav.dashboard, icon: "◎" },
    { to: "/tasks", label: sl.nav.tasks, icon: "✓" },
    { to: "/morning", label: sl.nav.morning, icon: "☀" },
    { to: "/midday", label: sl.nav.midday, icon: "◐", alert: drift },
    { to: "/night", label: sl.nav.night, icon: "☾" },
  ];
  const growth: NavDef[] = [
    { to: "/mapa", label: sl.nav.mapa, icon: "▦" },
    { to: "/goals", label: sl.nav.goals, icon: "✦" },
    { to: "/sunday", label: sl.nav.sunday, icon: "↻" },
  ];
  const community: NavDef[] = [
    { to: "/chat", label: sl.nav.publicChat, icon: "◈" },
    { to: "/leaderboard", label: sl.nav.leaderboard, icon: "≣" },
    { to: "/profile", label: sl.nav.profile, icon: "◍" },
  ];

  const renderItems = (items: NavDef[]) =>
    items.map((it) => (
      <NavLink
        key={it.to}
        to={it.to}
        end={it.to === "/"}
        onClick={onNavigate}
        className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
      >
        <span className="ico">{it.icon}</span>
        <span>{it.label}</span>
        {it.alert && <span className="badge-dot" />}
      </NavLink>
    ));

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="logo-slot" title="ZaLife">
          <img src="/logo.png" alt="ZaLife logo" className="logo-img" />
        </div>
        <div className="brand-text">
          <b>{sl.app.name}</b>
          <span>{sl.app.tagline}</span>
        </div>
      </div>

      <div className="nav-group-label">{sl.nav.sectionDaily}</div>
      {renderItems(daily)}

      <div className="nav-group-label">{sl.nav.sectionGrowth}</div>
      {renderItems(growth)}

      <div className="nav-group-label">{sl.nav.sectionCommunity}</div>
      {renderItems(community)}

      <div className="sidebar-foot">
        <div className="sidebar-user">
          {account?.picture ? (
            <img className="mini-avatar" src={account.picture} alt="" />
          ) : (
            <div className="mini-avatar">
              {(account?.name || "JZ").slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="su-meta">
            <b>{account?.name || "Voditelj"}</b>
            <span>{account?.email}</span>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm btn-block" onClick={onLogout}>
          ⎋ {sl.auth.logout}
        </button>
      </div>
    </aside>
  );
}
