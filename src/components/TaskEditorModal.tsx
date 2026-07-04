import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { sl } from "../i18n/sl";
import { GuardedInput } from "./GuardedField";
import { PILLARS } from "../data/pillars";
import { getSubAreaIdentity } from "../lib/pillarIdentity";
import { durationFromRange } from "../lib/taskTime";
import { useAppStore } from "../store/useAppStore";
import type { PlannerTask } from "../types";

export interface TaskEditorValues {
  pillar_id: string;
  pillar_metric_key: string;
  task_description: string;
  start_time: string;
  end_time: string;
  priority: boolean;
  recurring: boolean;
}

interface TaskEditorModalProps {
  dateISO: string;
  task?: PlannerTask;
  initial: TaskEditorValues;
  onSave: (values: TaskEditorValues) => void;
  onClose: () => void;
}

function composeTitle(
  pillarId: string,
  metricKey: string,
  identity: string,
  desc: string
): string {
  const pillar = PILLARS.find((p) => p.id === pillarId);
  if (!pillar) return desc.trim();
  const metric = pillar.metrics.find((m) => m.key === metricKey);
  const area = metric ? `${pillar.title} — ${metric.label}` : pillar.title;
  const id = identity.trim() || "—";
  return `${sl.tasks.prefixSemNa} ${area} — ${id} — ${sl.tasks.prefixZato} ${desc.trim()}`;
}

export function TaskEditorModal({
  task,
  initial,
  onSave,
  onClose,
}: TaskEditorModalProps) {
  const pillars = useAppStore((s) => s.pillars);
  const jazSem = useAppStore((s) => s.jaz_sem_status);
  const [values, setValues] = useState(initial);
  const [descViolation, setDescViolation] = useState(false);

  const identityPreview = getSubAreaIdentity(
    pillars,
    values.pillar_id,
    values.pillar_metric_key,
    jazSem
  );

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const pillar = PILLARS.find((p) => p.id === values.pillar_id);
  const duration = durationFromRange(values.start_time, values.end_time);
  const canSave =
    !!values.pillar_id &&
    !!values.pillar_metric_key &&
    values.task_description.trim().length > 1 &&
    values.start_time &&
    values.end_time &&
    duration > 0 &&
    !descViolation;

  const setPillar = (pillarId: string) => {
    const next = PILLARS.find((p) => p.id === pillarId);
    setValues((v) => ({
      ...v,
      pillar_id: pillarId,
      pillar_metric_key: next?.metrics[0]?.key ?? "",
    }));
  };

  return createPortal(
    <div className="modal-overlay task-modal-overlay" onClick={onClose}>
      <div
        className="modal task-modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="task-modal-head">
          <h2>{task ? sl.tasks.editTask : sl.tasks.newTask}</h2>
          <button className="exec-del" type="button" onClick={onClose} aria-label={sl.common.close}>
            ✕
          </button>
        </div>

        <div className="task-modal-body">
          <label className="field-label">{sl.tasks.pillarSelect}</label>
          <select
            className="input"
            value={values.pillar_id}
            onChange={(e) => setPillar(e.target.value)}
          >
            <option value="">{sl.tasks.pillarSelectPlaceholder}</option>
            {PILLARS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>

          {pillar && (
            <>
              <label className="field-label">{sl.tasks.subareaSelect}</label>
              <select
                className="input"
                value={values.pillar_metric_key}
                onChange={(e) =>
                  setValues((v) => ({ ...v, pillar_metric_key: e.target.value }))
                }
              >
                <option value="">{sl.tasks.subareaSelectPlaceholder}</option>
                {pillar.metrics.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label}
                  </option>
                ))}
              </select>

              <div className="task-identity-sync">
                <span className="task-identity-label">{sl.tasks.identityFromMapaSub}</span>
                <p>{identityPreview || sl.tasks.identityMapaEmptySub}</p>
              </div>
            </>
          )}

          <label className="field-label">{sl.tasks.descriptionLabel}</label>
          <GuardedInput
            className="input"
            value={values.task_description}
            placeholder={sl.tasks.addPlaceholder}
            onViolationChange={setDescViolation}
            onChange={(e) =>
              setValues((v) => ({ ...v, task_description: e.target.value }))
            }
          />

          <div className="task-time-row">
            <div className="field">
              <label className="field-label">{sl.tasks.timeStart}</label>
              <input
                type="time"
                className="input"
                value={values.start_time}
                onChange={(e) =>
                  setValues((v) => ({ ...v, start_time: e.target.value }))
                }
              />
            </div>
            <div className="field">
              <label className="field-label">{sl.tasks.timeEnd}</label>
              <input
                type="time"
                className="input"
                value={values.end_time}
                onChange={(e) =>
                  setValues((v) => ({ ...v, end_time: e.target.value }))
                }
              />
            </div>
            <div className="task-duration-pill">
              {duration > 0 ? `${duration} min` : "—"}
            </div>
          </div>

          {canSave && (
            <p className="small text-teal task-preview">
              „
              {composeTitle(
                values.pillar_id,
                values.pillar_metric_key,
                identityPreview,
                values.task_description
              )}
              "
            </p>
          )}

          <div className="add-task-opts" style={{ marginTop: 12 }}>
            <label className="opt-check">
              <input
                type="checkbox"
                checked={values.priority}
                onChange={(e) =>
                  setValues((v) => ({ ...v, priority: e.target.checked }))
                }
              />
              <span>⚡ {sl.tasks.priority}</span>
            </label>
            {!task && (
              <label className="opt-check">
                <input
                  type="checkbox"
                  checked={values.recurring}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, recurring: e.target.checked }))
                  }
                />
                <span>↻ {sl.tasks.recurring}</span>
              </label>
            )}
          </div>
        </div>

        <div className="task-modal-foot">
          <button
            className="btn btn-primary btn-block"
            type="button"
            disabled={!canSave}
            onClick={() => onSave(values)}
          >
            {sl.common.save}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export { composeTitle as composeTaskTitle };
