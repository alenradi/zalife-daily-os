/**
 * AI Agent Feature Ideation — printed to the developer console on boot (dev
 * only). These are next-step usability / gamification ideas aimed at keeping
 * teenagers out of "Drift" mode and locking in their tracking habits.
 */

const ANTI_DRIFT_IDEAS: string[] = [
  "1. Streak-Shield (Ščit niza): one-tap 'I'm at risk today' that lets a user bank a 2-minute micro-check-in to preserve their streak instead of losing it outright — loss-aversion keeps the habit alive on bad days.",
  "2. Identity Streaks per Pillar: track separate consistency streaks for each Life Pillar's future_self_identity, and surface a weekly 'most neglected pillar' nudge so no area silently drifts.",
  "3. Accountability Duo: pair two students whose drift_warnings rise together; when one drifts, the other gets a prompt to send a pre-written encouragement — peer pressure converted into peer support.",
];

const EXTRA_IDEAS: string[] = [
  "• Variable-reward 'Mystery XP' chests for completing all three day-phases (morning/midday/night) to reinforce the full loop.",
  "• Adaptive reminder timing: learn the hours a user usually drifts and shift the Mindset Reminder Engine to fire ~30 min before that window.",
  "• Future-Self letter: at signup the user writes a letter from their 1-year-future self; resurface it inside drift recovery modals for emotional leverage.",
  "• Weekly Identity Report card comparing stated future_self_identity vs. actual pillar metric movement, with an AI-mentor summary.",
  "• 'Comeback multiplier': award bonus XP for returning to Flow within 24h of a drift to reward recovery, not just perfection.",
  "• Calendar-aware planning: read free/busy from Google Calendar to warn when Top-3 tasks won't physically fit the day.",
];

export function logFeatureIdeas(): void {
  if (!import.meta.env.DEV) return;
  /* eslint-disable no-console */
  console.groupCollapsed(
    "%cZaLife Daily OS — AI Agent Feature Recommendations",
    "color:#EFA73B;font-weight:700;font-size:13px;"
  );
  console.info("%cAnti-Drift / habit-lock ideas:", "color:#FFB300;font-weight:600;");
  ANTI_DRIFT_IDEAS.forEach((i) => console.info(i));
  console.info("%cAdditional ideas to consider:", "color:#6fcf97;font-weight:600;");
  EXTRA_IDEAS.forEach((i) => console.info(i));
  console.groupEnd();
  /* eslint-enable no-console */
}
