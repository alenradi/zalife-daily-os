import { useState } from "react";
import { sl } from "../i18n/sl";
import { GuardedTextarea } from "./GuardedField";
import { useAppStore } from "../store/useAppStore";
import { containsAmpak } from "../lib/ampak";

/**
 * Dynamic Purpose Headers. Locked after first save; changes require a reason
 * via the "Spremeni" flow.
 */
export function IdentityHeaders({ editable = true }: { editable?: boolean }) {
  const purpose = useAppStore((s) => s.moj_smisel_zivljenja);
  const jazSem = useAppStore((s) => s.jaz_sem_status);
  const locked = useAppStore((s) => s.identity_locked);
  const editing = useAppStore((s) => s.identity_editing);
  const update = useAppStore((s) => s.updateIdentity);
  const lockIdentity = useAppStore((s) => s.lockIdentity);
  const unlockEdit = useAppStore((s) => s.unlockIdentityEdit);
  const commitChange = useAppStore((s) => s.commitIdentityChange);

  const [touched, setTouched] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");

  const isReadOnly = !editable || (locked && !editing);

  if (!editable) {
    return (
      <div className="identity-banner">
        <div className="card-sub" style={{ marginBottom: 6 }}>
          {sl.identity.purposeFieldLabel}
        </div>
        <div className="purpose">{purpose || sl.identity.purpose}</div>
        <div className="sub-identity">
          {sl.identity.jazSemLabel} {jazSem}
        </div>
      </div>
    );
  }

  const onRequestEdit = () => {
    setReason("");
    setReasonError("");
    setShowReasonModal(true);
  };

  const onConfirmReason = () => {
    const trimmed = reason.trim();
    if (trimmed.length < 10) {
      setReasonError(sl.identity.reasonTooShort);
      return;
    }
    if (containsAmpak(trimmed)) {
      setReasonError(sl.ampak.blocked);
      return;
    }
    unlockEdit(trimmed);
    setShowReasonModal(false);
  };

  const onSave = () => {
    if (editing) {
      commitChange();
    } else {
      lockIdentity();
    }
    setTouched(true);
  };

  return (
    <>
      <section className={`identity-editor ${locked && !editing ? "locked" : ""}`}>
        <div className="identity-editor-head">
          <span className="accent-bar" />
          <div className="flex1">
            <h3>{sl.identity.editTitle}</h3>
            <div className="card-sub">
              {locked && !editing
                ? sl.identity.lockedHint
                : editing
                  ? sl.identity.editingHint
                  : sl.identity.editHint}
            </div>
          </div>
          {locked && !editing ? (
            <button className="btn btn-ghost btn-sm" onClick={onRequestEdit} type="button">
              ✎ {sl.identity.changeBtn}
            </button>
          ) : (
            touched && (
              <span className="tag tag-teal">✓ {sl.identity.saved}</span>
            )
          )}
        </div>

        {isReadOnly ? (
          <div className="identity-locked-view">
            <div className="identity-locked-block">
              <div className="card-sub">{sl.identity.purposeFieldLabel}</div>
              <p className="identity-locked-text">{purpose}</p>
            </div>
            <div className="identity-locked-block">
              <div className="card-sub">{sl.identity.jazSemLabel}</div>
              <p className="identity-locked-text">{jazSem}</p>
            </div>
            <div className="identity-lock-badge">
              <span>🔒</span> {sl.identity.lockedBadge}
            </div>
          </div>
        ) : (
          <>
            <div className="field">
              <label>{sl.identity.purposeFieldLabel}</label>
              <GuardedTextarea
                rows={2}
                value={purpose}
                placeholder={sl.identity.purposePlaceholder}
                onChange={(e) => {
                  update({ moj_smisel_zivljenja: e.target.value });
                  setTouched(true);
                }}
              />
            </div>

            <div className="field" style={{ marginBottom: 12 }}>
              <label>{sl.identity.jazSemLabel}</label>
              <GuardedTextarea
                rows={2}
                value={jazSem}
                placeholder={sl.identity.jazSemPlaceholder}
                onChange={(e) => {
                  update({ jaz_sem_status: e.target.value });
                  setTouched(true);
                }}
              />
            </div>

            <button
              className="btn btn-primary btn-block"
              type="button"
              onClick={onSave}
              disabled={!purpose.trim() || !jazSem.trim()}
            >
              {editing ? sl.identity.saveChange : sl.identity.saveAndLock}
            </button>
          </>
        )}
      </section>

      {showReasonModal && (
        <div className="modal-overlay" onClick={() => setShowReasonModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <span className="modal-emoji">🪞</span>
            <h2>{sl.identity.changeTitle}</h2>
            <p>{sl.identity.changeQuestion}</p>
            <div className="field">
              <label>{sl.identity.changeReasonLabel}</label>
              <GuardedTextarea
                rows={3}
                value={reason}
                placeholder={sl.identity.changeReasonPlaceholder}
                onChange={(e) => {
                  setReason(e.target.value);
                  setReasonError("");
                }}
              />
              {reasonError && (
                <p className="small text-crimson" style={{ marginTop: 6 }}>
                  {reasonError}
                </p>
              )}
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => setShowReasonModal(false)}
              >
                {sl.common.cancel}
              </button>
              <button className="btn btn-primary" type="button" onClick={onConfirmReason}>
                {sl.identity.changeConfirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
