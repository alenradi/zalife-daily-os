/**
 * OpenAI GPT-4o mini mentor handler (server-side only).
 */

import {
  MENTOR_SYSTEM_PROMPT,
  type MentorContext,
} from "../src/lib/mentorPrompt.js";

export interface MentorRequestBody {
  mode: "greeting" | "chat";
  message?: string;
  context: MentorContext;
  history?: { role: string; content: string }[];
}

function contextBlock(ctx: MentorContext): string {
  return [
    `Student: ${ctx.display_name}`,
    `Status: ${ctx.status}`,
    `Streak: ${ctx.streak_days} days`,
    `Drift warnings: ${ctx.drift_warnings}/5`,
    `Incomplete top tasks: ${
      ctx.incomplete_top_tasks.length
        ? ctx.incomplete_top_tasks.join(", ")
        : "none"
    }`,
  ].join("\n");
}

export async function runMentorOpenAI(
  apiKey: string,
  body: MentorRequestBody
): Promise<string> {
  const system = `${MENTOR_SYSTEM_PROMPT}\n\nCurrent student metrics:\n${contextBlock(body.context)}`;

  const history = (body.history ?? []).map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: m.content,
  }));

  const userContent =
    body.mode === "greeting"
      ? "Write a short opening coaching message in Slovene (2-3 sentences). Be direct. Reference their current status and one concrete action."
      : (body.message ?? "").trim();

  if (body.mode === "chat" && !userContent) {
    throw new Error("Empty message");
  }

  const messages = [
    { role: "system" as const, content: system },
    ...history,
    { role: "user" as const, content: userContent },
  ];

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.65,
      max_tokens: 450,
      messages,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const reply = data.choices?.[0]?.message?.content?.trim();
  if (!reply) throw new Error("Empty AI response");
  return reply;
}
