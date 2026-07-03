import { sl } from "../i18n/sl";

interface LockScreenProps {
  title: string;
  message: string;
  opensAt: string;
}

/** Time-gated lock placeholder shown until a feature's window opens (GMT+2). */
export function LockScreen({ title, message, opensAt }: LockScreenProps) {
  return (
    <div className="lock-screen">
      <span className="lk-icon">🔒</span>
      <h3>{title}</h3>
      <p>{message}</p>
      <div className="opens">
        {sl.locks.opensAt} {opensAt}
      </div>
      <p className="small text-muted">{sl.clock.zone}</p>
    </div>
  );
}
