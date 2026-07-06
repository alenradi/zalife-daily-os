import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { sl } from "../i18n/sl";
import { MentorPanel } from "./MentorPanel";

/** Floating AI mentor on mobile/tablet (desktop uses the right rail). */
export function AgentFab() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const drawer = open
    ? createPortal(
        <div className="agent-drawer-backdrop" onClick={() => setOpen(false)}>
          <div
            className="agent-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="agent-drawer-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="agent-drawer-head">
              <h3 id="agent-drawer-title">{sl.mentor.title}</h3>
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
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <button
        className={`agent-fab ${open ? "agent-fab-hidden" : ""}`}
        type="button"
        aria-label={sl.mentor.title}
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <img src="/logo.png" alt="" className="agent-fab-logo" />
        <span>AI</span>
      </button>
      {drawer}
    </>
  );
}
