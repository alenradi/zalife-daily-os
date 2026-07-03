import { useEffect } from "react";
import { createPortal } from "react-dom";
import { sl } from "../i18n/sl";
import { GuardedTextarea } from "./GuardedField";
import { useAppStore } from "../store/useAppStore";
import type { PillarDef } from "../data/pillars";

interface PillarEditorModalProps {
  pillar: PillarDef;
  onClose: () => void;
}

/** Full editor for one life pillar — portaled so it isn't clipped by the page scroll. */
export function PillarEditorModal({ pillar, onClose }: PillarEditorModalProps) {
  const pillars = useAppStore((s) => s.pillars);
  const updateMetric = useAppStore((s) => s.updatePillarMetric);
  const updateIdentity = useAppStore((s) => s.updatePillarIdentity);

  const state = pillars.find((p) => p.pillar_id === pillar.id);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div className="modal-overlay pillar-modal-overlay" onClick={onClose}>
      <div
        className="modal pillar-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pillar-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pillar-modal-head">
          <div>
            <h2 id="pillar-modal-title">{pillar.title}</h2>
            <p className="card-sub">{pillar.subtitle}</p>
          </div>
          <button
            className="exec-del"
            type="button"
            onClick={onClose}
            aria-label={sl.common.close}
          >
            ✕
          </button>
        </div>

        <div className="pillar-modal-body">
          <div className="pillar-future pillar-future-modal">
            <label>{sl.identity.futureSelfLabel}</label>
            <GuardedTextarea
              rows={4}
              value={state?.future_self_identity ?? ""}
              placeholder={sl.identity.futureSelfPlaceholder}
              onChange={(e) => updateIdentity(pillar.id, e.target.value)}
            />
          </div>

          <div className="pillar-metrics-modal">
            {pillar.metrics.map((m) => {
              const metric = state?.metrics.find((x) => x.key === m.key);
              const value = metric?.value ?? 0;
              return (
                <div className="pillar-metric-modal" key={m.key}>
                  <div className="m-label pillar-m-label">
                    <span className="pillar-metric-name">{m.label}</span>
                    <span className="text-teal pillar-metric-value">{value}</span>
                  </div>
                  <p className="small text-muted metric-hint">{m.hint}</p>
                  <div className="slider-wrap">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={value}
                      className="slider pillar-slider"
                      onChange={(e) =>
                        updateMetric(pillar.id, m.key, {
                          value: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <GuardedTextarea
                    rows={3}
                    value={metric?.note ?? ""}
                    placeholder={`Zapiski: ${m.hint}`}
                    onChange={(e) =>
                      updateMetric(pillar.id, m.key, { note: e.target.value })
                    }
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="pillar-modal-foot">
          <button className="btn btn-primary btn-block" type="button" onClick={onClose}>
            {sl.common.save}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/** Compact pillar card — tap to open the full editor. */
export function PillarCard({
  pillar,
  onOpen,
}: {
  pillar: PillarDef;
  onOpen: () => void;
}) {
  const pillars = useAppStore((s) => s.pillars);
  const state = pillars.find((p) => p.pillar_id === pillar.id);
  const avg =
    state && state.metrics.length > 0
      ? Math.round(
          state.metrics.reduce((a, m) => a + m.value, 0) / state.metrics.length
        )
      : 0;
  const preview = state?.future_self_identity?.trim() || "—";

  return (
    <button className="pillar pillar-card-btn" type="button" onClick={onOpen}>
      <h3>{pillar.title}</h3>
      <div className="pillar-sub">{pillar.subtitle}</div>
      <div className="pillar-card-score">
        <span className="text-teal bold">{avg}%</span>
        <span className="small text-muted">povprečje</span>
      </div>
      <p className="pillar-card-preview">{preview}</p>
      <span className="small text-accent">{sl.mapa.openPillar} →</span>
    </button>
  );
}
