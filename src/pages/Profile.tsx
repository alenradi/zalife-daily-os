import { useRef, useState } from "react";
import { sl } from "../i18n/sl";
import { Card, PageHead, StatTile } from "../components/ui";
import { GuardedInput } from "../components/GuardedField";
import { useAppStore } from "../store/useAppStore";
import { useAuthStore } from "../store/useAuthStore";
import { connectGoogleCalendar } from "../api/calendar";
import { levelFromXp } from "../lib/xp";

export function Profile() {
  const profile = useAppStore((s) => s.profile);
  const update = useAppStore((s) => s.updateProfile);
  const connectCalendar = useAppStore((s) => s.connectCalendar);
  const hasToken = useAuthStore((s) => s.hasValidGoogleToken());
  const xp = useAppStore((s) => s.xp_points);
  const streak = useAppStore((s) => s.streak_days);
  const resets = useAppStore((s) => Object.keys(s.weekly_resets).length);
  const goals = useAppStore((s) => s.goals.length);

  const [connecting, setConnecting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const calendarLive = profile.calendar_connected && hasToken;
  const calendarEmail = profile.calendar_email;

  const onAvatar = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => update({ avatar_url: String(reader.result) });
    reader.readAsDataURL(file);
  };

  const doConnect = async () => {
    setConnecting(true);
    try {
      const res = await connectGoogleCalendar();
      if (res.connected) {
        connectCalendar();
        if (res.account) update({ calendar_email: res.account });
      }
    } catch (e) {
      console.error("[calendar] connect failed", e);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="page">
      <PageHead title={sl.profile.title}>{sl.profile.subtitle}</PageHead>

      <div className="grid grid-2">
        <Card title={sl.profile.title}>
          <div className="row center gap-sm" style={{ marginBottom: 18 }}>
            {profile.avatar_url ? (
              <img
                className="avatar"
                style={{ width: 72, height: 72 }}
                src={profile.avatar_url}
                alt=""
              />
            ) : (
              <div className="avatar" style={{ width: 72, height: 72, fontSize: 22 }}>
                {(profile.display_name || "JZ").slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="flex1">
              <div className="field" style={{ marginBottom: 8 }}>
                <label>{sl.profile.avatar}</label>
                <span className="hint">{sl.profile.avatarHint}</span>
              </div>
              <GuardedInput
                value={profile.avatar_url.startsWith("data:") ? "" : profile.avatar_url}
                placeholder="https://..."
                onChange={(e) => update({ avatar_url: e.target.value })}
              />
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="input mt-sm"
                onChange={(e) => onAvatar(e.target.files?.[0])}
              />
            </div>
          </div>

          <div className="field">
            <label>{sl.profile.name}</label>
            <GuardedInput
              value={profile.display_name}
              onChange={(e) => update({ display_name: e.target.value })}
            />
          </div>
          <div className="row gap-sm">
            <div className="field flex1">
              <label>{sl.profile.age}</label>
              <input
                type="number"
                min={13}
                max={19}
                className="input"
                value={profile.age}
                onChange={(e) => update({ age: Number(e.target.value) })}
              />
            </div>
            <div className="field flex1">
              <label>{sl.profile.email}</label>
              <input
                type="email"
                className="input"
                value={profile.email}
                onChange={(e) => update({ email: e.target.value })}
              />
            </div>
          </div>
        </Card>

        <div className="col sticky-col" style={{ gap: 20 }}>
          <Card title={sl.profile.stats}>
            <div className="grid grid-2">
              <StatTile k={sl.common.xp} v={xp} tone="teal" />
              <StatTile k={sl.common.level} v={levelFromXp(xp)} />
              <StatTile k={sl.common.streak} v={`${streak} ${sl.common.days}`} tone="gold" />
              <StatTile k={sl.admin.resets} v={resets} />
              <StatTile k={sl.goals.title} v={goals} />
            </div>
          </Card>

          <Card title={sl.profile.calendar} sub={sl.profile.calendarDesc}>
            {calendarLive ? (
              <>
                <div className="cal-connected">
                  <span className="cal-dot" />
                  <div>
                    <b>✓ {sl.profile.calendarConnected}</b>
                    {calendarEmail && (
                      <div className="small text-muted">
                        {sl.profile.calendarConnectedAs}: {calendarEmail}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  className="btn btn-ghost btn-sm btn-block mt"
                  disabled={connecting}
                  onClick={doConnect}
                >
                  {connecting ? sl.auth.connecting : sl.profile.calendarReconnect}
                </button>
              </>
            ) : profile.calendar_connected ? (
              <>
                <p className="small text-crimson" style={{ marginBottom: 12 }}>
                  ⚠ {sl.profile.calendarTokenExpired}
                </p>
                <button
                  className="btn btn-primary btn-block"
                  disabled={connecting}
                  onClick={doConnect}
                >
                  📅 {connecting ? sl.auth.connecting : sl.profile.calendarReconnect}
                </button>
              </>
            ) : (
              <button
                className="btn btn-primary btn-block"
                disabled={connecting}
                onClick={doConnect}
              >
                📅 {connecting ? sl.auth.connecting : sl.profile.connectCalendar}
              </button>
            )}
            <p className="small text-muted mt-sm">{sl.profile.calendarNote}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
