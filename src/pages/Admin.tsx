import { useEffect, useState } from "react";
import { sl } from "../i18n/sl";
import { Card, PageHead, StatTile } from "../components/ui";
import { useCloudUsers } from "../hooks/useCloudUsers";
import { isCloudConfigured } from "../lib/supabase";
import type { StudentRecord } from "../types";

function progressScore(s: StudentRecord) {
  const weekly = Math.min(40, Math.round((s.weekly_xp / 1200) * 40));
  const streak = Math.min(30, Math.round((s.streak_days / 14) * 30));
  const resets = Math.min(20, Math.round((s.sunday_resets_completed / 6) * 20));
  const warningsPenalty = s.drift_warnings * 6;
  return Math.max(0, Math.min(100, weekly + streak + resets + 10 - warningsPenalty));
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("sl-SI");
  } catch {
    return iso;
  }
}

export function Admin() {
  const { all, loading, me } = useCloudUsers();

  const [selectedId, setSelectedId] = useState(me.user_id);

  useEffect(() => {
    setSelectedId(me.user_id);
  }, [me.user_id]);

  const selected = all.find((s) => s.user_id === selectedId) ?? me;
  const selectedProgress = progressScore(selected);

  const flow = all.filter((s) => s.status === "FLOW").length;
  const drift = all.filter((s) => s.status === "DRIFT").length;
  const locked = all.filter((s) => s.locked).length;

  return (
    <div className="page">
      <PageHead title={sl.admin.title}>{sl.admin.subtitle}</PageHead>

      {isCloudConfigured() && (
        <div className="tag tag-teal" style={{ marginBottom: 14 }}>
          {loading ? "Nalagam podatke iz oblaka ..." : `☁ ${all.length} uporabnikov`}
        </div>
      )}
      {!isCloudConfigured() && (
        <div className="tag" style={{ marginBottom: 14 }}>
          ⚠ Oblak ni nastavljen — prikazani so samo lokalni podatki
        </div>
      )}

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <StatTile k="Udeleženci" v={all.length} />
        <StatTile k={sl.status.flow} v={flow} tone="teal" />
        <StatTile k={sl.status.drift} v={drift} tone="gold" />
        <StatTile k="Zaklenjeni" v={locked} />
      </div>

      <Card>
        <div className="admin-table-head">
          <span>{sl.admin.student}</span>
          <span>{sl.admin.state}</span>
          <span>{sl.admin.xpLevel}</span>
          <span>{sl.admin.warnings}</span>
          <span>{sl.admin.goalsResets}</span>
        </div>
        {all.map((s) => (
          <button
            className={`admin-row admin-row-btn ${
              s.user_id === selected.user_id ? "active" : ""
            }`}
            key={s.user_id}
            onClick={() => setSelectedId(s.user_id)}
          >
            <div className="lb-name">
              <div className="mini-avatar">
                {s.display_name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="bold" style={{ color: "var(--white)" }}>
                  {s.display_name}
                  {s.user_id === me.user_id && (
                    <span className="text-teal small"> (ti)</span>
                  )}
                </div>
                {s.email && (
                  <div className="small text-muted">{s.email}</div>
                )}
                {s.locked && (
                  <span className="small text-crimson">🔒 {sl.common.locked}</span>
                )}
              </div>
            </div>
            <div>
              <span
                className={`status-pill ${
                  s.status === "FLOW" ? "status-flow" : "status-drift"
                }`}
                style={{ fontSize: 11, padding: "4px 10px" }}
              >
                <span className="dot" />
                {s.status === "FLOW" ? sl.status.flow : sl.status.drift}
              </span>
            </div>
            <div>
              <div className="bold text-teal">{s.xp_points} XP</div>
              <div className="small text-muted">
                {sl.common.level} {s.level}
              </div>
            </div>
            <div>
              <span
                className={`bold ${s.drift_warnings >= 4 ? "text-crimson" : "text-gold"}`}
              >
                {s.drift_warnings}/5
              </span>
            </div>
            <div>
              <div className="small">
                {sl.admin.activeGoals}: <b>{s.active_goals.length}</b>
              </div>
              <div className="small text-muted">
                {s.active_goals.slice(0, 2).join(", ") || "—"}
              </div>
              <div className="small text-muted">
                {sl.admin.resets}: {s.sunday_resets_completed}
              </div>
            </div>
          </button>
        ))}
      </Card>

      <div className="admin-detail-grid">
        <Card
          title={`${selected.display_name} - podrobnosti`}
          sub="Status, napredek in coaching signal"
        >
          <div className="student-detail-head">
            <div className="mini-avatar detail-avatar">
              {selected.display_name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3>{selected.display_name}</h3>
              <div className="small text-muted">
                Nivo {selected.level} · {selected.xp_points} XP · {selected.weekly_xp} XP ta teden
              </div>
              {selected.email && (
                <div className="small text-muted">{selected.email}</div>
              )}
              {selected.provider && (
                <div className="small text-muted">
                  Prijava: {selected.provider === "google" ? "Google" : "E-pošta"}
                </div>
              )}
            </div>
            <span
              className={`status-pill ${
                selected.status === "FLOW" ? "status-flow" : "status-drift"
              }`}
            >
              <span className="dot" />
              {selected.status === "FLOW" ? sl.status.flow : sl.status.drift}
            </span>
          </div>

          <div className="admin-progress">
            <div className="row between center">
              <span className="bold">Skupni napredek</span>
              <span className="text-accent bold">{selectedProgress}%</span>
            </div>
            <div className="pbar">
              <span style={{ width: `${selectedProgress}%` }} />
            </div>
          </div>

          <div className="student-detail-stats">
            <div>
              <span>Streak</span>
              <b>{selected.streak_days} dni</b>
            </div>
            <div>
              <span>Opozorila</span>
              <b className={selected.drift_warnings >= 4 ? "text-crimson" : ""}>
                {selected.drift_warnings}/5
              </b>
            </div>
            <div>
              <span>Reseti</span>
              <b>{selected.sunday_resets_completed}</b>
            </div>
            <div>
              <span>Zaklep</span>
              <b className={selected.locked ? "text-crimson" : "text-green"}>
                {selected.locked ? "Da" : "Ne"}
              </b>
            </div>
            <div>
              <span>Koledar</span>
              <b>{selected.calendar_connected ? "Povezan" : "Ne"}</b>
            </div>
            <div>
              <span>Zadnja sinhronizacija</span>
              <b className="small">{formatDate(selected.last_sync_at)}</b>
            </div>
          </div>

          <div className="admin-identity-block">
            <b>Smisel življenja</b>
            <p>{selected.moj_smisel_zivljenja || "—"}</p>
            <b>Jaz sem</b>
            <p>{selected.jaz_sem_status || "—"}</p>
          </div>

          <div className="student-detail-stats" style={{ marginTop: 12 }}>
            <div>
              <span>Današnji jutro</span>
              <b>{selected.morning_submitted_today ? "✓" : "—"}</b>
            </div>
            <div>
              <span>Opoldne</span>
              <b>{selected.midday_submitted_today ? "✓" : "—"}</b>
            </div>
            <div>
              <span>Večer</span>
              <b>{selected.night_submitted_today ? "✓" : "—"}</b>
            </div>
            <div>
              <span>Doseženi cilji</span>
              <b>{selected.goals_completed ?? 0}</b>
            </div>
          </div>
        </Card>

        <Card title="Aktivni cilji" sub="Kaj trenutno gradi">
          {selected.active_goals.length > 0 ? (
            <div className="student-goals">
              {selected.active_goals.map((goal) => (
                <div className="student-goal" key={goal}>
                  {goal}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted small">Ni aktivnih ciljev. Priporočen je nov SMART cilj.</p>
          )}

          {selected.identity_change_log && selected.identity_change_log.length > 0 && (
            <div className="admin-coach-note" style={{ marginTop: 16 }}>
              <b>Zgodovina sprememb identitete</b>
              {selected.identity_change_log.slice(0, 3).map((entry) => (
                <div key={entry.id} className="small" style={{ marginTop: 8 }}>
                  <div className="text-muted">{formatDate(entry.changed_at)}</div>
                  <div><b>Razlog:</b> {entry.reason}</div>
                </div>
              ))}
            </div>
          )}

          <div className="admin-coach-note">
            <b>Mentor signal</b>
            <p>
              {selected.locked
                ? "Učenec je zaklenjen. Potreben je osebni check-in in obnovitveni plan."
                : selected.status === "DRIFT"
                  ? "Učenec je v Zaniku. Preveri energijo, fokus in najmanjši naslednji korak."
                  : "Učenec je v Toku. Ohranjaj momentum z jasnim tedenskim izzivom."}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
