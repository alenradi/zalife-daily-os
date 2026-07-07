import { useMemo, useRef, useState } from "react";
import { sl } from "../i18n/sl";
import { Card, EmptyState, PageHead } from "../components/ui";
import { GuardedInput, GuardedTextarea } from "../components/GuardedField";
import { useAppStore } from "../store/useAppStore";
import { goalTaskSuggestions } from "../lib/goalTaskSuggestions";
import { todayISO } from "../lib/date";
import { defaultSlotForDay } from "../lib/taskTime";
import type { SmartGoal } from "../types";

const blank = {
  specific: "",
  measurable: "",
  achievable: "",
  relatable: "",
  time_relevant: "",
  reward_image_url: "",
  identity_built: "",
};

function GoalCard({ goal }: { goal: SmartGoal }) {
  const completeGoal = useAppStore((s) => s.completeGoal);
  const deleteGoal = useAppStore((s) => s.deleteGoal);
  const addPlannerTask = useAppStore((s) => s.addPlannerTask);
  const plannerToday = useAppStore((s) => s.planner_tasks[todayISO()] ?? []);
  const [addedKeys, setAddedKeys] = useState<Set<string>>(new Set());

  const suggestions = useMemo(() => goalTaskSuggestions(goal), [goal]);

  const addSuggestion = (title: string) => {
    const slot = defaultSlotForDay(
      plannerToday.map((t) => t.start_time).filter(Boolean) as string[]
    );
    addPlannerTask(todayISO(), {
      title,
      task_description: title,
      duration_minutes: 60,
      start_time: slot.start,
      end_time: slot.end,
      priority: false,
      recurring: false,
    });
    setAddedKeys((prev) => new Set(prev).add(title));
  };

  return (
    <div className={`goal-card ${goal.completed ? "completed" : ""}`}>
      <div
        className="goal-reward"
        style={{
          backgroundImage: goal.reward_image_url
            ? `url(${goal.reward_image_url})`
            : "linear-gradient(135deg,#1f2833,#121212)",
        }}
      >
        <div className="mesh">
          <div>
            <span className="lock">{goal.completed ? "🏆" : "🔒"}</span>
            {goal.completed ? sl.common.completed : sl.goals.lockedReward}
          </div>
        </div>
      </div>
      <div className="goal-body">
        <h4>{goal.specific}</h4>
        <div className="smart-line">
          <span className="k">M</span>
          <span className="vv">{goal.measurable}</span>
        </div>
        <div className="smart-line">
          <span className="k">A</span>
          <span className="vv">{goal.achievable}</span>
        </div>
        <div className="smart-line">
          <span className="k">R</span>
          <span className="vv">{goal.relatable}</span>
        </div>
        <div className="smart-line">
          <span className="k">T</span>
          <span className="vv">{goal.time_relevant}</span>
        </div>
        {goal.identity_built && (
          <div className="goal-identity">
            <span className="tag tag-teal">{sl.goals.identityTag}</span>
            <p>„{goal.identity_built}"</p>
          </div>
        )}
        {!goal.completed && suggestions.length > 0 && (
          <div className="goal-suggestions mt">
            <div className="card-sub" style={{ marginBottom: 8 }}>
              {sl.goals.suggestedTasks}
            </div>
            {suggestions.map((s) => (
              <div
                key={s.title}
                className="row between center gap-sm"
                style={{ marginBottom: 8 }}
              >
                <span className="small">{s.title}</span>
                <button
                  className="btn btn-ghost btn-sm"
                  type="button"
                  disabled={addedKeys.has(s.title)}
                  onClick={() => addSuggestion(s.title)}
                >
                  {addedKeys.has(s.title)
                    ? sl.goals.suggestedAdded
                    : sl.goals.addSuggestedTask}
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="row gap-sm mt">
          {!goal.completed && (
            <button
              className="btn btn-primary btn-sm flex1"
              onClick={() => completeGoal(goal.id)}
            >
              {sl.goals.markComplete}
            </button>
          )}
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => deleteGoal(goal.id)}
          >
            {sl.common.delete}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Goals() {
  const goals = useAppStore((s) => s.goals);
  const createGoal = useAppStore((s) => s.createGoal);
  const [form, setForm] = useState(blank);
  const [violation, setViolation] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof typeof blank, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const canCreate =
    form.specific.trim() &&
    form.measurable.trim() &&
    form.relatable.trim() &&
    form.time_relevant.trim() &&
    form.identity_built.trim() &&
    !violation;

  const onFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set("reward_image_url", String(reader.result));
    reader.readAsDataURL(file);
  };

  const submit = () => {
    if (!canCreate) return;
    createGoal(form);
    setForm(blank);
    if (fileRef.current) fileRef.current.value = "";
  };

  const active = goals.filter((g) => !g.completed);
  const done = goals.filter((g) => g.completed);

  return (
    <div className="page">
      <PageHead title={sl.goals.title}>{sl.goals.subtitle}</PageHead>

      <div className="grid grid-2">
        <Card title={sl.goals.newGoal}>
          <div className="field">
            <label>{sl.goals.specific}</label>
            <GuardedInput
              value={form.specific}
              onViolationChange={setViolation}
              onChange={(e) => set("specific", e.target.value)}
            />
          </div>
          <div className="field">
            <label>{sl.goals.measurable}</label>
            <GuardedInput
              value={form.measurable}
              onViolationChange={setViolation}
              onChange={(e) => set("measurable", e.target.value)}
            />
          </div>
          <div className="field">
            <label>{sl.goals.achievable}</label>
            <GuardedInput
              value={form.achievable}
              onViolationChange={setViolation}
              onChange={(e) => set("achievable", e.target.value)}
            />
          </div>
          <div className="field">
            <label>{sl.goals.relatable}</label>
            <GuardedTextarea
              rows={2}
              value={form.relatable}
              onViolationChange={setViolation}
              onChange={(e) => set("relatable", e.target.value)}
            />
          </div>
          <div className="field identity-goal-field">
            <label>{sl.goals.identityLabel}</label>
            <GuardedTextarea
              rows={2}
              value={form.identity_built}
              placeholder={sl.goals.identityPlaceholder}
              onViolationChange={setViolation}
              onChange={(e) => set("identity_built", e.target.value)}
            />
          </div>
          <div className="field">
            <label>{sl.goals.timeRelevant}</label>
            <input
              type="date"
              className="input"
              value={form.time_relevant}
              onChange={(e) => set("time_relevant", e.target.value)}
            />
          </div>

          <div className="field">
            <label>{sl.goals.rewardImage}</label>
            <span className="hint">{sl.goals.rewardHint}</span>
            <GuardedInput
              value={form.reward_image_url.startsWith("data:") ? "" : form.reward_image_url}
              placeholder="https://..."
              onChange={(e) => set("reward_image_url", e.target.value)}
            />
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="input mt-sm"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
          </div>

          {violation && (
            <p className="small text-crimson">{sl.ampak.blocked}</p>
          )}
          <button
            className="btn btn-primary btn-block mt"
            disabled={!canCreate}
            onClick={submit}
          >
            {sl.goals.create}
          </button>
        </Card>

        <div>
          {form.reward_image_url && (
            <Card title="Predogled nagrade" className="mt" >
              <div
                className="goal-reward"
                style={{
                  borderRadius: 12,
                  backgroundImage: `url(${form.reward_image_url})`,
                }}
              >
                <div className="mesh">
                  <div>
                    <span className="lock">🔒</span>
                    {sl.goals.lockedReward}
                  </div>
                </div>
              </div>
            </Card>
          )}
          {!form.reward_image_url && (
            <Card title="Vizualna nagrada">
              <p className="text-muted small">
                Dodaj sliko svoje nagrade. Ostala bo zamegljena, dokler cilja ne
                dosežeš. To je tvoj vizualni motivator.
              </p>
            </Card>
          )}
        </div>
      </div>

      <h3 style={{ margin: "28px 0 14px" }}>
        {sl.goals.activeGoals} ({active.length})
      </h3>
      {active.length === 0 ? (
        <EmptyState>{sl.goals.empty}</EmptyState>
      ) : (
        <div className="grid grid-3">
          {active.map((g) => (
            <GoalCard key={g.id} goal={g} />
          ))}
        </div>
      )}

      {done.length > 0 && (
        <>
          <h3 style={{ margin: "28px 0 14px" }}>
            {sl.goals.completedGoals} ({done.length})
          </h3>
          <div className="grid grid-3">
            {done.map((g) => (
              <GoalCard key={g.id} goal={g} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
