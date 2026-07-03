/**
 * AI Mentorship Companion — GPT-4o mini via /api/mentor (see server/mentorHandler.ts).
 */

import {
  MENTOR_SYSTEM_PROMPT,
  type MentorContext,
} from "../lib/mentorPrompt";

export { MENTOR_SYSTEM_PROMPT, type MentorContext };

const AI_ENDPOINT =
  (import.meta.env.VITE_AI_ENDPOINT as string | undefined) || "/api/mentor";

function localGreeting(ctx: MentorContext): string {
  if (ctx.status === "DRIFT") {
    return `Opažam, da si padel v DRIFT. Imaš trenutno ${Math.max(
      1,
      ctx.drift_warnings
    )} opozorilo. Kakšen je tvoj natančen načrt za preostanek dneva? Bodi specifičen.`;
  }
  if (ctx.incomplete_top_tasks.length > 0) {
    return `Si v FLOW, ${ctx.streak_days}-dnevni niz. Še vedno imaš nedokončane prioritete: ${ctx.incomplete_top_tasks
      .slice(0, 3)
      .join(", ")}. Kdaj točno jih zaključiš?`;
  }
  return `Lep niz, ${ctx.streak_days} dni v toku. Ne popusti zdaj. Kaj je danes ena stvar, ki bo naredila največjo razliko?`;
}

function localReply(message: string, ctx: MentorContext): string {
  const lower = message.toLowerCase();
  if (/\bampak\b/u.test(lower)) {
    return "Stop. Slišim 'ampak'. Voditelji uporabljajo 'IN'. Preoblikuj svojo izjavo z 'in' in mi povej pravi naslednji korak.";
  }
  if (/ne morem|ne gre|preveč|nimam časa/.test(lower)) {
    return "To je izgovor, ne dejstvo. Razdeli to na en majhen korak, ki ga lahko narediš v naslednjih 15 minutah. Kateri je?";
  }
  if (ctx.status === "DRIFT") {
    return "Dobro, da pišeš. Zdaj pa konkretno: katero eno dejanje te v naslednji uri vrne v FLOW? Zapiši ga in ga izvedi.";
  }
  return "Razumem. Bodi specifičen in merljiv. Določi rok in se zaveži. Kaj boš naredil najprej?";
}

async function callMentorApi(body: {
  mode: "greeting" | "chat";
  message?: string;
  context: MentorContext;
  history?: { role: string; content: string }[];
}): Promise<string | null> {
  try {
    const res = await fetch(AI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { reply?: string };
    return data.reply?.trim() || null;
  } catch {
    return null;
  }
}

export async function sendMentorMessage(
  message: string,
  ctx: MentorContext,
  history: { role: string; content: string }[] = []
): Promise<string> {
  const live = await callMentorApi({
    mode: "chat",
    message,
    context: ctx,
    history,
  });
  if (live) return live;

  await new Promise((r) => setTimeout(r, 400));
  return localReply(message, ctx);
}

export async function mentorOpeningLine(ctx: MentorContext): Promise<string> {
  const live = await callMentorApi({ mode: "greeting", context: ctx });
  if (live) return live;
  return localGreeting(ctx);
}
