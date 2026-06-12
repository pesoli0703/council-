/* Vercel serverless function — live AI deliberation, powered by Google Gemini.
 *
 * SETUP:
 *   1. Get a free key at https://aistudio.google.com  ("Get API key")
 *   2. In Vercel: Project → Settings → Environment Variables
 *        GEMINI_API_KEY = AIza...your-key...
 *      (or run:  vercel env add GEMINI_API_KEY)
 *   3. Redeploy. The app's header badge flips to "AI mode" automatically.
 *
 * If the key is missing or the call fails, the front-end falls back to the
 * local offline engine, so the app NEVER breaks.
 *
 * Endpoint: POST /api/deliberate
 * Body: { members: [...profiles], decision: { question, context, stakes } }
 *
 * Model: defaults to gemini-2.5-flash (fast, free-tier eligible, 1M context).
 *        Override with env GEMINI_MODEL (e.g. gemini-2.0-flash, gemini-2.5-flash-lite).
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(501).json({ error: "AI not configured", fallback: true });
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  try {
    const { members, decision } = req.body || {};
    if (!members?.length || !decision?.question) {
      return res.status(400).json({ error: "Missing members or decision" });
    }

    const roster = members
      .map(
        m =>
          `- id: ${m.id} | ${m.name} (${m.category}) | values: ${(m.values || []).join(
            ", "
          )} | decision lens: ${m.lens} | tone: ${m.tone}`
      )
      .join("\n");

    const prompt = `You are "Council", a decision companion. The user has assembled a personal board of perspectives MODELED ON real people. Your job is to make EACH member respond authentically in their OWN voice, vocabulary, rhythm, and worldview — they must sound clearly different from one another, not like generic advice.

RULES:
- For each member, write a 2-4 sentence response to the user's decision, fully in that person's authentic worldview, values, and tone.
- These are "perspectives inspired by" the person. NEVER claim to be them, and do NOT fabricate fake direct quotes. Paraphrased sentiment is fine.
- Be respectful, especially with spiritual or sacred figures (e.g. Jesus): draw humbly on widely known teachings, no presumption.
- Members should genuinely DIFFER — assign each a "lean" of "go", "caution", or "depends" based on how that person would truly see this decision.
- "confidence" is 0-95 representing their conviction.
- "quote" is a short fitting line (paraphrased sentiment, clearly not a fabricated exact citation).

Then write a "synthesis" object: where members agree, the core tension, a suggested direction, and 3-4 reflective questions.

Return ONLY valid JSON in EXACTLY this shape (no markdown, no backticks):
{
  "responses": [
    { "memberId": "<one of the ids below>", "name": "...", "lean": "go|caution|depends", "confidence": 0-95, "text": "...", "quote": "..." }
  ],
  "synthesis": { "headline": "...", "direction": "...", "agree": ["..."], "tension": "...", "questions": ["..."] }
}

BOARD MEMBERS (use these exact ids):
${roster}

THE DECISION: ${decision.question}
CONTEXT: ${decision.context || "(none provided)"}
STAKES: ${decision.stakes || "medium"}

Produce exactly one response object per board member listed above.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.85,
          responseMimeType: "application/json"
        }
      })
    });

    if (!resp.ok) {
      const t = await resp.text();
      return res.status(502).json({ error: "Gemini error", detail: t, fallback: true });
    }

    const data = await resp.json();
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const parsed = JSON.parse(content);

    if (!parsed.responses || !parsed.responses.length) {
      return res.status(502).json({ error: "Empty AI result", fallback: true });
    }

    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: String(err), fallback: true });
  }
}
