import { useState } from "react";
import { sl } from "../i18n/sl";
import { MentorPanel } from "./MentorPanel";

/** Floating AI mentor on mobile/tablet (desktop uses the right rail). */
export function AgentFab() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="agent-fab"
        type="button"
        aria-label={sl.mentor.title}
        onClick={() => setOpen((v) => !v)}
      >
        <img src="/logo.png" alt="" className="agent-fab-logo" />
        <span>AI</span>
      </button>

      {open && (
        <div className="agent-drawer-backdrop" onClick={() => setOpen(false)}>
          <div
            className="agent-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="agent-drawer-head">
              <h3>{sl.mentor.title}</h3>
              <button
                className="exec-del"
                type="button"
                onClick={() => setOpen(false)}
                aria-label={sl.common.close}
              >
                ✕
              </button>
            </div>
            <MentorPanel compact />
          </div>
        </div>
      )}
    </>
  );
}
