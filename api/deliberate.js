/* Vercel serverless function — live AI deliberation, powered by Google Gemini. */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(501).json({ error: "AI not configured", fallback: true });
  }

  // FIXED: Changed to 1.5-flash which is the correct stable version
  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";

  try {
    const { members, decision, followup, priorResult } = req.body || {};
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

    // ---- Follow-up mode ----
    if (followup) {
      const priorText = priorResult?.responses
        ? priorResult.responses.map(r => `${r.name}: ${r.text}`).join("\n")
        : "(none)";
      const fPrompt = `You are "Council". Answer a FOLLOW-UP question. 
      Answer as a blended voice of the board. Speak directly and specifically.
      
      BOARD: ${roster}
      ORIGINAL DECISION: ${decision.question}
      FOLLOW-UP: ${followup}
      Return ONLY JSON: { "followupAnswer": "..." }`;

      const fUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const fResp = await fetch(fUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: fPrompt }] }],
          generationConfig: { temperature: 0.8, responseMimeType: "application/json" }
        })
      });
      const fData = await fResp.json();
      const fContent = fData?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      return res.status(200).json(JSON.parse(fContent));
    }

    // ---- Standard Deliberation ----
    const prompt = `You are "Council". You are acting as a board of directors for a user's decision.
    
    FOR EACH MEMBER BELOW:
    1. Provide a 3-4 sentence response in their EXACT first-person voice and personality.
    2. Do not use generic advice. Use their specific worldview to judge the decision.
    3. Determine a "lean": "go", "caution", or "depends".
    
    THE DECISION: "${decision.question}"
    CONTEXT: "${decision.context || "None"}"
    STAKES: "${decision.stakes || "medium"}"

    BOARD MEMBERS:
    ${roster}

    Return ONLY valid JSON in this shape:
    {
      "responses": [
        { "memberId": "...", "name": "...", "lean": "go|caution|depends", "confidence": 70-95, "text": "...", "quote": "..." }
      ],
      "synthesis": { "headline": "...", "direction": "...", "agree": ["..."], "tension": "...", "questions": ["..."] }
    }
    
    Produce exactly one response per board member. Speak AS them.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.9,
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

    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: String(err), fallback: true });
  }
}
