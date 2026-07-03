import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sl } from "../i18n/sl";
import { GuardedTextarea } from "./GuardedField";
import { useAppStore } from "../store/useAppStore";
import { connectGoogleCalendar } from "../api/calendar";

export function Onboarding() {
  const completed = useAppStore((s) => s.onboarding_completed);
  const complete = useAppStore((s) => s.completeOnboarding);
  const updateIdentity = useAppStore((s) => s.updateIdentity);
  const lockIdentity = useAppStore((s) => s.lockIdentity);
  const purpose = useAppStore((s) => s.moj_smisel_zivljenja);
  const jazSem = useAppStore((s) => s.jaz_sem_status);
  const name = useAppStore((s) => s.profile.display_name);

  const [step, setStep] = useState(0);
  const [localPurpose, setLocalPurpose] = useState(purpose);
  const [localJazSem, setLocalJazSem] = useState(jazSem);
  const [connecting, setConnecting] = useState(false);
  const navigate = useNavigate();

  if (completed) return null;

  const steps = sl.onboarding.steps;
  const isLast = step >= steps.length - 1;

  const next = () => {
    if (step === 1) {
      updateIdentity({
        moj_smisel_zivljenja: localPurpose.trim(),
        jaz_sem_status: localJazSem.trim(),
      });
      if (localPurpose.trim() && localJazSem.trim()) lockIdentity();
    }
    if (isLast) {
      complete();
      navigate("/morning");
      return;
    }
    setStep((s) => s + 1);
  };

  const connectCal = async () => {
    setConnecting(true);
    try {
      await connectGoogleCalendar();
    } catch {
      /* optional step */
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="modal-overlay onboarding-overlay">
      <div className="modal onboarding-modal" onClick={(e) => e.stopPropagation()}>
        <div className="onboarding-head">
          <img src="/logo.png" alt="ZaLife" className="onboarding-logo" />
          <div className="onboarding-dots">
            {steps.map((_, i) => (
              <span key={i} className={`ob-dot ${i === step ? "active" : ""}`} />
            ))}
          </div>
        </div>

        {step === 0 && (
          <>
            <h2>{sl.onboarding.welcome(name || sl.onboarding.friend)}</h2>
            <p>{steps[0].body}</p>
          </>
        )}

        {step === 1 && (
          <>
            <h2>{steps[1].title}</h2>
            <p className="card-sub">{steps[1].body}</p>
            <div className="field">
              <label>{sl.identity.purposeFieldLabel}</label>
              <GuardedTextarea
                rows={2}
                value={localPurpose}
                onChange={(e) => setLocalPurpose(e.target.value)}
              />
            </div>
            <div className="field">
              <label>{sl.identity.jazSemLabel}</label>
              <GuardedTextarea
                rows={2}
                value={localJazSem}
                onChange={(e) => setLocalJazSem(e.target.value)}
              />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2>{steps[2].title}</h2>
            <p>{steps[2].body}</p>
            <ul className="onboarding-list">
              {sl.onboarding.cycle.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </>
        )}

        {step === 3 && (
          <>
            <h2>{steps[3].title}</h2>
            <p>{steps[3].body}</p>
            <div className="row gap-sm" style={{ marginTop: 14 }}>
              <span className={`status-pill status-flow`}>
                <span className="dot" />
                {sl.status.flow}
              </span>
              <span className="text-muted">vs</span>
              <span className={`status-pill status-drift`}>
                <span className="dot" />
                {sl.status.drift}
              </span>
            </div>
            <p className="small text-muted mt">{sl.onboarding.statusHint}</p>
          </>
        )}

        {step === 4 && (
          <>
            <h2>{steps[4].title}</h2>
            <p>{steps[4].body}</p>
            <button
              className="btn btn-ghost btn-block mt"
              disabled={connecting}
              onClick={connectCal}
              type="button"
            >
              📅 {connecting ? sl.auth.connecting : sl.profile.connectCalendar}
            </button>
          </>
        )}

        <div className="modal-actions onboarding-actions">
          {step > 0 && (
            <button className="btn btn-ghost" onClick={() => setStep((s) => s - 1)} type="button">
              {sl.common.back}
            </button>
          )}
          <button
            className="btn btn-primary flex1"
            onClick={next}
            disabled={step === 1 && (!localPurpose.trim() || !localJazSem.trim())}
            type="button"
          >
            {isLast ? sl.onboarding.start : sl.common.continue}
          </button>
        </div>
      </div>
    </div>
  );
}
