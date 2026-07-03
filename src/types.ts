/**
 * Core domain types. All schema fields are English by engineering rule.
 */

export type LifeStatus = "FLOW" | "DRIFT";

export interface Task {
  id: string;
  title: string;
  duration_minutes: number;
  completed: boolean;
}

/** A task on the weekly Execution Plan board. */
export interface PlannerTask {
  id: string;
  title: string; // composed, display-ready identity-driven string
  duration_minutes: number;
  priority: boolean; // high-XP priority
  recurring: boolean; // repeats every day
  completed: boolean; // used for one-off tasks
  created_at: string;
  // ----- identity-driven task structure -----
  pillar_id?: string; // which Life Pillar this action serves
  identity_trait?: string; // the trait/identity the user is acting from
  task_description?: string; // the raw action description
  calendar_event_id?: string; // Google Calendar event id (import / dedup)
  from_calendar?: boolean;
}

/**
 * Structured identity reflection captured in the Morning Flow Planner.
 * Forces the user to define WHO is creating the day before executing it.
 */
export interface MorningIdentity {
  creator: string; // "Kdo sem jaz in kdo bo danes to ustvarjal?"
  feeling: string; // "Kako se bom počutil, ko izpolnim današnje obveznosti?"
  goal_alignment: string; // how the 3 goals build the improved version of me
}

export interface MorningPlan {
  date: string; // ISO yyyy-mm-dd
  gratitude: [string, string, string];
  top_tasks: Task[];
  identity_today?: MorningIdentity;
  submitted: boolean;
  submitted_before_ten: boolean;
}

export interface MiddayCheckin {
  date: string;
  mood: number; // 0-100
  energy: number; // 0-100
  focus: number; // 0-100
  plan_completion: number; // 0-100 percentage of morning tasks done
  submitted: boolean;
}

export interface NightReflection {
  date: string;
  wins: [string, string, string];
  note: string;
  submitted: boolean;
}

export interface DailyLog {
  date: string;
  morning?: MorningPlan;
  midday?: MiddayCheckin;
  night?: NightReflection;
  xp_earned: number;
  status: LifeStatus;
}

export interface SmartGoal {
  id: string;
  specific: string;
  measurable: string;
  achievable: string;
  relatable: string;
  time_relevant: string; // deadline date
  reward_image_url: string;
  // Identity link: "Kdo jaz bom, ko delam na tem cilju in katero verzijo sebe
  // s tem gradim?" — mandatory in the goal-creation wizard.
  identity_built: string;
  completed: boolean;
  created_at: string;
  completed_at?: string;
}

export interface WeeklyReset {
  week_id: string; // e.g. 2026-W26
  biggest_lesson: string;
  drift_reflection: string;
  honesty_rating: number; // 1-10
  next_week_plan: string;
  xp_earned_week: number;
  tasks_completed_week: number;
  consistency_score: number;
  submitted: boolean;
  submitted_at?: string;
}

/** Pillar metric tracked manually in Mapa Zivljenja. */
export interface PillarMetricValue {
  key: string;
  value: number; // 0-100 self rating
  note: string;
}

export interface PillarState {
  pillar_id: string;
  metrics: PillarMetricValue[];
  // "Kakšen sem in postajam v prihodnosti na tem področju?" — the future-self
  // vision the user is building inside this pillar. Drives identity reminders.
  future_self_identity: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

/** Shared community message visible to all app users. */
export interface PublicChatMessage {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string;
  content: string;
  created_at: string;
}

export interface UserProfile {
  user_id: string;
  display_name: string;
  age: number;
  email: string;
  avatar_url: string;
  calendar_connected: boolean;
  calendar_email?: string;
}

/** Logged when a user changes their locked identity fields. */
export interface IdentityChangeEntry {
  id: string;
  changed_at: string;
  reason: string;
  previous_purpose: string;
  previous_jaz_sem: string;
  new_purpose: string;
  new_jaz_sem: string;
}

/** Aggregated metrics for leaderboard / admin. */
export interface StudentRecord {
  user_id: string;
  display_name: string;
  avatar_url: string;
  email?: string;
  status: LifeStatus;
  xp_points: number;
  level: number;
  weekly_xp: number;
  streak_days: number;
  drift_warnings: number;
  active_goals: string[];
  sunday_resets_completed: number;
  locked: boolean;
  // Extended admin fields (populated from cloud sync when available)
  moj_smisel_zivljenja?: string;
  jaz_sem_status?: string;
  identity_change_log?: IdentityChangeEntry[];
  calendar_connected?: boolean;
  last_sync_at?: string;
  morning_submitted_today?: boolean;
  midday_submitted_today?: boolean;
  night_submitted_today?: boolean;
  goals_completed?: number;
  provider?: string;
}
