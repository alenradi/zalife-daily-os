import { Link } from "react-router-dom";
import { sl } from "../i18n/sl";
import { Card, PageHead, StatTile } from "../components/ui";
import { IdentityHeaders } from "../components/IdentityHeaders";
import { useAppStore, selectMyRecord } from "../store/useAppStore";
import { todayISO, dayPhase, lastNDates } from "../lib/date";
import { levelProgress } from "../lib/xp";

function greeting() {
  const p = dayPhase();
  if (p === "morning") return sl.dashboard.greetingMorning;
  if (p === "night") return sl.dashboard.greetingEvening;
  return sl.dashboard.greetingDay;
}

export function Dashboard() {
  const store = useAppStore();
  const me = selectMyRecord(store);
  const today = store.daily_logs[todayISO()];
  const prog = levelProgress(store.xp_points);

  const tasksDone =
    today?.morning?.top_tasks.filter((t) => t.completed).length ?? 0;
  const tasksTotal = today?.morning?.top_tasks.length ?? 0;

  const last7 = lastNDates(7);
  const activeDays = last7.filter(
    (d) => store.daily_logs[d]?.morning?.submitted || store.daily_logs[d]?.night?.submitted
  ).length;
  const consistency = Math.round((activeDays / 7) * 100);

  const phases = [
    { to: "/morning", label: sl.nav.morning, done: !!today?.morning?.submitted },
    { to: "/midday", label: sl.nav.midday, done: !!today?.midday?.submitted },
    { to: "/night", label: sl.nav.night, done: !!today?.night?.submitted },
    { to: "/sunday", label: sl.nav.sunday, done: false },
  ];

  const nextStep = !today?.morning?.submitted
    ? { label: sl.nav.morning, to: "/morning" }
    : !today?.midday?.submitted
    ? { label: sl.nav.midday, to: "/midday" }
    : !today?.night?.submitted
    ? { label: sl.nav.night, to: "/night" }
    : { label: sl.nav.goals, to: "/goals" };

  return (
    <div className="page">
      <PageHead title={`${greeting()}, ${store.profile.display_name}.`}>
        {sl.dashboard.subtitle}
      </PageHead>

      <IdentityHeaders editable />

      <div className="grid grid-4" style={{ marginBottom: 20, marginTop: 20 }}>
        <StatTile k={sl.dashboard.weeklyXp} v={me.weekly_xp} tone="teal" />
        <StatTile
          k={sl.dashboard.tasksDone}
          v={`${tasksDone}/${tasksTotal || 3}`}
        />
        <StatTile k={sl.dashboard.consistency} v={`${consistency}%`} />
        <StatTile
          k={`${sl.common.streak} (${sl.common.days})`}
          v={store.streak_days}
          tone="gold"
        />
      </div>

      <div className="grid grid-2">
        <Card title={sl.dashboard.dayPipeline} sub={`${sl.common.level} ${prog.level} • ${prog.percent}%`}>
          <div className="row wrap gap-sm" style={{ marginBottom: 16 }}>
            {phases.map((p) => (
              <Link
                key={p.to}
                to={p.to}
                className={`phase-pill ${p.done ? "done" : "active"}`}
              >
                {p.done ? "✓" : "○"} {p.label}
              </Link>
            ))}
          </div>
          <div className="card-sub" style={{ marginBottom: 6 }}>
            {sl.dashboard.nextStep}
          </div>
          <Link to={nextStep.to} className="btn btn-primary btn-block">
            → {nextStep.label}
          </Link>
        </Card>

        <Card title={sl.dashboard.quickActions}>
          <div className="col gap-sm">
            <Link to="/morning" className="btn btn-ghost btn-block">
              ☀ {sl.nav.morning}
            </Link>
            <Link to="/goals" className="btn btn-ghost btn-block">
              ✦ {sl.nav.goals}
            </Link>
            <Link to="/mapa" className="btn btn-ghost btn-block">
              ▦ {sl.nav.mapa}
            </Link>
          </div>
        </Card>
      </div>

      {tasksTotal > 0 && (
        <Card title={sl.dashboard.todayProgress} className="mt">
          {today?.morning?.top_tasks.map((t) => (
            <div key={t.id} className={`task-row ${t.completed ? "done" : ""}`}>
              <div className={`checkbox ${t.completed ? "checked" : ""}`}>
                {t.completed ? "✓" : ""}
              </div>
              <span className="label">{t.title}</span>
              <span className="dur">
                {t.duration_minutes} {sl.common.minutes}
              </span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
