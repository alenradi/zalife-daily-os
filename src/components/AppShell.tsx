import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { MobileNav } from "./MobileNav";
import { ErrorBoundary } from "./ErrorBoundary";
import { MentorPanel } from "./MentorPanel";
import { sl } from "../i18n/sl";
import { useAppStore } from "../store/useAppStore";
import { isSundayResetOpen, weekId } from "../lib/date";
import { Onboarding } from "./Onboarding";
import { AgentFab } from "./AgentFab";

const TITLES: Record<string, { title: string; sub: string }> = {
  "/": { title: sl.nav.dashboard, sub: sl.dashboard.subtitle },
  "/tasks": { title: sl.tasks.title, sub: sl.tasks.subtitle },
  "/morning": { title: sl.morning.title, sub: sl.morning.subtitle },
  "/midday": { title: sl.midday.title, sub: sl.midday.subtitle },
  "/night": { title: sl.night.title, sub: sl.night.subtitle },
  "/mapa": { title: sl.nav.mapa, sub: sl.identity.purposeLabel },
  "/goals": { title: sl.goals.title, sub: sl.goals.subtitle },
  "/sunday": { title: sl.sunday.title, sub: sl.sunday.subtitle },
  "/leaderboard": { title: sl.leaderboard.title, sub: sl.leaderboard.subtitle },
  "/chat": { title: sl.publicChat.title, sub: sl.publicChat.subtitle },
  "/profile": { title: sl.profile.title, sub: sl.profile.subtitle },
};

export function AppShell() {
  const loc = useLocation();
  const reset = useAppStore((s) => s.weekly_resets[weekId()]);
  const meta = TITLES[loc.pathname] ?? { title: sl.app.name, sub: "" };
  const [menuOpen, setMenuOpen] = useState(false);

  // Auto-close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [loc.pathname]);

  // Sunday gate: from 18:00 on Sunday, freeze OS until weekly reset is logged.
  const sundayLocked =
    isSundayResetOpen() && !reset?.submitted && loc.pathname !== "/sunday";

  return (
    <div className={`app-shell ${menuOpen ? "menu-open" : ""}`}>
      <Onboarding />
      <Sidebar onNavigate={() => setMenuOpen(false)} />
      <div
        className="mobile-backdrop"
        onClick={() => setMenuOpen(false)}
        aria-hidden
      />
      <div className="main-col">
        <Header
          title={meta.title}
          subtitle={meta.sub}
          onMenu={() => setMenuOpen((v) => !v)}
        />
        <div className="content-scroll">
          {sundayLocked ? (
            <div className="page">
              <div className="lock-banner">
                <span className="lk">🔒</span>
                <div>
                  <b>{sl.sunday.title}</b>
                  <div className="small">{sl.sunday.lockMsg}</div>
                </div>
              </div>
              <Link to="/sunday" className="btn btn-gold">
                → {sl.sunday.title}
              </Link>
            </div>
          ) : (
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          )}
        </div>
        <Footer />
      </div>
      <aside className="mentor-rail" aria-label={sl.mentor.title}>
        <MentorPanel />
      </aside>
      <MobileNav onMore={() => setMenuOpen(true)} />
      <AgentFab />
    </div>
  );
}
