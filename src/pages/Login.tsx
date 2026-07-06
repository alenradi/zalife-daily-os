import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { sl } from "../i18n/sl";
import { useAuthStore } from "../store/useAuthStore";
import { useAppStore } from "../store/useAppStore";
import { markFreshUserSession } from "../hooks/useUserSession";
import {
  isGoogleConfigured,
  requestGoogleAccess,
  fetchGoogleUser,
} from "../lib/google";

type Mode = "login" | "signup";

export function Login() {
  const navigate = useNavigate();
  const signupEmail = useAuthStore((s) => s.signupEmail);
  const loginEmail = useAuthStore((s) => s.loginEmail);
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const connectCalendar = useAppStore((s) => s.connectCalendar);
  const updateProfile = useAppStore((s) => s.updateProfile);

  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [googleBusy, setGoogleBusy] = useState(false);

  const onEmailSubmit = (ev: FormEvent) => {
    ev.preventDefault();
    setError("");
    if (mode === "signup") {
      const res = signupEmail(name, email, password);
      if (!res.ok) return setError(res.error || "Napaka.");
      const acc = useAuthStore.getState().currentAccount();
      if (acc) markFreshUserSession(acc.id);
    } else {
      const res = loginEmail(email, password);
      if (!res.ok) return setError(res.error || "Napaka.");
    }
    navigate("/");
  };

  const onGoogle = async () => {
    setError("");
    setGoogleBusy(true);
    try {
      const token = await requestGoogleAccess();
      const user = await fetchGoogleUser(token.access_token);
      const { account } = loginWithGoogle(user, token);
      connectCalendar();
      updateProfile({ calendar_email: account.email });
      navigate("/");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(
        msg.includes("google_not_configured")
          ? sl.auth.googleNotConfigured
          : msg.includes("invalid_client")
            ? sl.auth.googleInvalidClient
            : msg.includes("access_denied")
              ? sl.auth.googleDenied
              : sl.auth.googleFailed
      );
      console.error(e);
    } finally {
      setGoogleBusy(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-aside">
        <div className="auth-brand">
          <div className="logo-slot" style={{ width: 64, height: 64 }}>
            <img src="/logo.png" alt="ZaLife" className="logo-img" />
          </div>
          <div>
            <h1>{sl.app.name}</h1>
          </div>
        </div>
        <h2 className="auth-headline">
          <span>Dobrodošel v</span>
          <span>ZaLife Daily OS</span>
        </h2>
        <p className="auth-tagline">{sl.auth.welcomeSub}</p>
        <ul className="auth-points">
          <li>🔥 XP, nivoji in dnevni Flow</li>
          <li>📅 Sinhronizacija nalog z Google Koledarjem</li>
          <li>🏆 Tekmuj na lestvici voditeljev</li>
        </ul>
        <div className="auth-quote">
          „Disciplina je izbira med tem, kar si želiš zdaj, in tem, kar si želiš
          najbolj."
        </div>
      </div>

      <div className="auth-panel">
        <div className="auth-mobile-brand">
          <div className="logo-slot" style={{ width: 52, height: 52 }}>
            <img src="/logo.png" alt="ZaLife" className="logo-img" />
          </div>
          <div>
            <h1>{sl.app.name}</h1>
            <p className="auth-mobile-tagline">{sl.app.tagline}</p>
          </div>
        </div>
        <div className="auth-card">
          <div className="auth-tabs">
            <button
              className={`auth-tab ${mode === "login" ? "active" : ""}`}
              onClick={() => {
                setMode("login");
                setError("");
              }}
            >
              {sl.auth.loginTab}
            </button>
            <button
              className={`auth-tab ${mode === "signup" ? "active" : ""}`}
              onClick={() => {
                setMode("signup");
                setError("");
              }}
            >
              {sl.auth.signupTab}
            </button>
          </div>

          {!isGoogleConfigured() && import.meta.env.PROD && (
            <div className="auth-config-warn">
              {sl.auth.googleNotConfigured}
            </div>
          )}
          <button
            className="btn google-btn btn-block"
            onClick={onGoogle}
            disabled={googleBusy || (!isGoogleConfigured() && import.meta.env.PROD)}
          >
            <GoogleIcon />
            {googleBusy ? sl.auth.connecting : sl.auth.google}
          </button>
          <p className="small text-muted center-text" style={{ marginTop: 8 }}>
            {sl.auth.googleHint}
          </p>

          <div className="auth-divider">
            <span>{sl.auth.orEmail}</span>
          </div>

          <form onSubmit={onEmailSubmit}>
            {mode === "signup" && (
              <div className="field">
                <label>{sl.auth.name}</label>
                <input
                  className="input"
                  value={name}
                  placeholder={sl.auth.namePlaceholder}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
            <div className="field">
              <label>{sl.auth.email}</label>
              <input
                className="input"
                type="email"
                value={email}
                placeholder={sl.auth.emailPlaceholder}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="field">
              <label>{sl.auth.password}</label>
              <input
                className="input"
                type="password"
                value={password}
                placeholder={sl.auth.passwordPlaceholder}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && <p className="small text-crimson">{error}</p>}

            <button className="btn btn-primary btn-block mt" type="submit">
              {mode === "login" ? sl.auth.loginBtn : sl.auth.signupBtn}
            </button>
          </form>

          <button
            className="auth-switch"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError("");
            }}
          >
            {mode === "login" ? sl.auth.noAccount : sl.auth.haveAccount}
          </button>

          <p className="auth-legal">{sl.auth.legal}</p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.5 29.6 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.5 29.6 4.5 24 4.5 16.3 4.5 9.7 8.9 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 43.5c5.5 0 10.3-2.1 13.9-5.5l-6.4-5.4c-2 1.5-4.6 2.4-7.5 2.4-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.6 39 16.2 43.5 24 43.5z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.4 5.4C41 36.5 43.5 30.8 43.5 24c0-1.2-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}
