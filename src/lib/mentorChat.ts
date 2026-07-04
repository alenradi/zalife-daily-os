import { sl } from "../i18n/sl";

/** AI mentor chat is disabled until the live API is ready. */
export const MENTOR_LIVE = false;

export function mentorComingSoonMessage(): string {
  return sl.mentor.comingSoonBody;
}
