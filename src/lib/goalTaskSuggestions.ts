import type { SmartGoal } from "../types";

export interface GoalTaskSuggestion {
  title: string;
  task_description: string;
}

/** Derive actionable planner tasks from a SMART goal's fields. */
export function goalTaskSuggestions(goal: SmartGoal): GoalTaskSuggestion[] {
  const out: GoalTaskSuggestion[] = [];
  const push = (text: string) => {
    const t = text.trim();
    if (t.length > 2 && !out.some((x) => x.title === t)) {
      out.push({ title: t, task_description: t });
    }
  };

  if (goal.achievable?.trim()) push(goal.achievable);
  if (goal.measurable?.trim()) push(`Merjenje napredka: ${goal.measurable}`);
  if (goal.specific?.trim()) {
    const step =
      goal.specific.length > 100
        ? `${goal.specific.slice(0, 97)}...`
        : goal.specific;
    push(`Korak k cilju: ${step}`);
  }

  return out.slice(0, 3);
}
