import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { sl } from "../i18n/sl";
import { Admin } from "./Admin";

const ADMIN_CODE =
  (import.meta.env.VITE_ADMIN_CODE as string | undefined) || "ZALIFE-ADMIN-2026";
const SESSION_KEY = "zalife_admin_unlocked";

/**
 * Standalone, passcode-protected entry to the Super-Admin control room.
 * Intentionally NOT linked from the regular user navigation.
 */
export function AdminGate() {
  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === "1"
  );
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const tryUnlock = (e: FormEvent) => {
    e.preventDefault();
    if (code.trim() === ADMIN_CODE) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setUnlocked(true);
      setError("");
    } else {
      setError(sl.admin.gateError);
    }
  };

  const lock = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setUnlocked(false);
    setCode("");
  };

  if (!unlocked) {
    return (
      <div className="auth-screen admin-gate">
        <div className="auth-panel" style={{ gridColumn: "1 / -1" }}>
          <div className="auth-card">
            <div className="logo-slot" style={{ width: 56, height: 56, margin: "0 auto 16px" }}>
              <img src="/logo.png" alt="ZaLife" className="logo-img" />
            </div>
            <h2 className="center-text">{sl.admin.gateTitle}</h2>
            <p className="center-text text-muted small" style={{ marginBottom: 20 }}>
              {sl.admin.gateSub}
            </p>
            <form onSubmit={tryUnlock}>
              <div className="field">
                <label>{sl.admin.gateCode}</label>
                <input
                  className="input"
                  type="password"
                  value={code}
                  autoFocus
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>
              {error && <p className="small text-crimson">{error}</p>}
              <button className="btn btn-primary btn-block mt" type="submit">
                {sl.admin.gateEnter}
              </button>
            </form>
            <Link
              to="/"
              className="auth-switch"
              style={{ display: "block", textAlign: "center" }}
            >
              {sl.admin.backToApp}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-standalone">
      <header className="topbar">
        <div className="row center gap-sm">
          <div className="logo-slot" style={{ width: 40, height: 40 }}>
            <img src="/logo.png" alt="ZaLife" className="logo-img" />
          </div>
          <div>
            <h1>{sl.admin.title}</h1>
            <div className="sub">{sl.admin.subtitle}</div>
          </div>
        </div>
        <div className="topbar-spacer" />
        <Link to="/" className="btn btn-ghost btn-sm">
          {sl.admin.backToApp}
        </Link>
        <button className="btn btn-danger btn-sm" onClick={lock}>
          {sl.admin.lockOut}
        </button>
      </header>
      <div className="content-scroll">
        <Admin />
      </div>
    </div>
  );
}
