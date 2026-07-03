import { useEffect, useState } from "react";
import { sl } from "../i18n/sl";
import { Card, PageHead } from "../components/ui";
import { useCloudUsers } from "../hooks/useCloudUsers";
import type { StudentRecord } from "../types";

const BOOTCAMP_END = new Date("2026-07-10T20:00:00");

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function useCountdown(target: Date) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const diff = Math.max(0, target.getTime() - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { days, hours, minutes, seconds, ended: diff === 0 };
}

function AwardBanner({ leader }: { leader: StudentRecord }) {
  const { days, hours, minutes, seconds, ended } = useCountdown(BOOTCAMP_END);
  return (
    <div className="award-banner">
      <div className="award-trophy">
        <div className={`mystery-box ${ended ? "revealed" : ""}`}>
          {ended ? "🏆" : "🎁"}
        </div>
      </div>
      <div className="award-info">
        <div className="tag tag-gold" style={{ marginBottom: 8 }}>
          ★ {sl.award.title}
        </div>
        <p className="award-sub">{sl.award.subtitle}</p>
        {!ended ? (
          <>
            <div className="award-locked">🔒 {sl.award.locked}</div>
            <div className="countdown">
              <CountUnit n={days} label={sl.award.countdownDays} />
              <CountUnit n={hours} label={sl.award.countdownHours} />
              <CountUnit n={minutes} label={sl.award.countdownMinutes} />
              <CountUnit n={seconds} label={sl.award.countdownSeconds} />
            </div>
            <div className="small text-muted mt-sm">
              {sl.award.endsLabel}: 10.7.2026 · {sl.award.leadingNow}:{" "}
              <span className="text-gold bold">{leader.display_name}</span>
            </div>
          </>
        ) : (
          <div className="award-winner">
            🎉 {sl.award.winner}:{" "}
            <span className="text-gold bold">{leader.display_name}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function CountUnit({ n, label }: { n: number; label: string }) {
  return (
    <div className="count-unit">
      <div className="count-num">{String(n).padStart(2, "0")}</div>
      <div className="count-label">{label}</div>
    </div>
  );
}

export function Leaderboard() {
  const { all, loading, me } = useCloudUsers();
  const [sortBy, setSortBy] = useState<"weekly_xp" | "streak_days">("weekly_xp");

  const sorted = [...all].sort((a, b) => b[sortBy] - a[sortBy]);
  const awardLeader = [...all].sort(
    (a, b) => b.weekly_xp - a.weekly_xp || b.streak_days - a.streak_days
  )[0] ?? me;

  return (
    <div className="page">
      <PageHead title={sl.leaderboard.title}>{sl.leaderboard.subtitle}</PageHead>

      {loading && (
        <p className="small text-muted" style={{ marginBottom: 12 }}>
          Nalagam udeležence ...
        </p>
      )}

      <AwardBanner leader={awardLeader} />

      <div className="row gap-sm center between sticky-toolbar" style={{ marginTop: 24 }}>
        <div className="row gap-sm">
          <button
            className={`btn btn-sm ${sortBy === "weekly_xp" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setSortBy("weekly_xp")}
          >
            {sl.leaderboard.byXp}
          </button>
          <button
            className={`btn btn-sm ${sortBy === "streak_days" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setSortBy("streak_days")}
          >
            {sl.leaderboard.byStreak}
          </button>
        </div>
        <span className="small text-muted">
          {sl.common.level} {me.level} · {me.weekly_xp} {sl.leaderboard.byXp}
        </span>
      </div>

      <Card>
        {sorted.length === 0 ? (
          <p className="small text-muted center-text" style={{ padding: 24 }}>
            {sl.leaderboard.empty}
          </p>
        ) : (
          sorted.map((s, i) => (
            <div
              key={s.user_id}
              className={`lb-row ${i === 0 ? "top1" : ""} ${
                s.user_id === me.user_id ? "me" : ""
              }`}
            >
              <div className="rank">{i === 0 ? "★" : i + 1}</div>
              <div className="lb-name">
                {s.avatar_url ? (
                  <img className="mini-avatar" src={s.avatar_url} alt="" />
                ) : (
                  <div className="mini-avatar">{initials(s.display_name)}</div>
                )}
                <div>
                  <div className="bold" style={{ color: "var(--white)" }}>
                    {s.display_name}
                    {s.user_id === me.user_id && (
                      <span className="text-teal small"> (ti)</span>
                    )}
                  </div>
                  <div className="small text-muted">
                    {sl.common.level} {s.level} •{" "}
                    <span
                      className={s.status === "FLOW" ? "text-teal" : "text-gold"}
                    >
                      {s.status === "FLOW" ? sl.status.flow : sl.status.drift}
                    </span>
                  </div>
                </div>
              </div>
              <div className="center-text">
                <div className="text-teal bold">{s.weekly_xp}</div>
                <div className="small text-muted">{sl.leaderboard.byXp}</div>
              </div>
              <div className="center-text">
                <div className="text-gold bold">🔥 {s.streak_days}</div>
                <div className="small text-muted">{sl.common.days}</div>
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
