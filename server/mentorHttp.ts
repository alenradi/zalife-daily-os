import type { IncomingMessage, ServerResponse } from "node:http";
import { runMentorOpenAI, type MentorRequestBody } from "../server/mentorHandler.js";

function readJson(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

/** Dev + Vercel handler for POST /api/mentor */
export async function handleMentorRequest(
  req: IncomingMessage,
  res: ServerResponse,
  apiKey: string | undefined
) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  if (!apiKey) {
    res.statusCode = 503;
    res.end(
      JSON.stringify({
        error: "OPENAI_API_KEY is not configured on the server.",
      })
    );
    return;
  }

  try {
    const body = (await readJson(req)) as MentorRequestBody;
    const reply = await runMentorOpenAI(apiKey, body);
    res.statusCode = 200;
    res.end(JSON.stringify({ reply }));
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Mentor request failed";
    res.statusCode = 500;
    res.end(JSON.stringify({ error: msg }));
  }
}
