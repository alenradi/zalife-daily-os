import { runMentorOpenAI, type MentorRequestBody } from "../server/mentorHandler.js";

interface VercelRequest {
  method?: string;
  body?: MentorRequestBody;
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: "OPENAI_API_KEY is not configured on the server.",
    });
  }

  try {
    const reply = await runMentorOpenAI(apiKey, req.body as MentorRequestBody);
    return res.status(200).json({ reply });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Mentor request failed";
    return res.status(500).json({ error: msg });
  }
}
