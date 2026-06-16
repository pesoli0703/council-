/* Council API — Version 4.0 (Stable v1beta) */
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) return res.status(501).json({ error: "API Key missing" });

  try {
    const { members, decision } = req.body;
    const roster = members.map(m => `- ${m.name}: ${m.lens}`).join("\n");

    const prompt = `You are a board of directors. Decision: "${decision.question}". Context: ${decision.context || "None"}.
    
    Respond as these members, giving each 3-4 sentences of unique, personal advice in their own voice:
    ${roster}

    Return ONLY a JSON object. No markdown, no backticks.
    {
      "responses": [
        { "memberId": "...", "name": "...", "lean": "go|caution|depends", "confidence": 90, "text": "...", "quote": "..." }
      ],
      "synthesis": { "headline": "...", "direction": "...", "agree": [], "tension": "...", "questions": [] }
    }`;

    // THE VERSION 4 URL: v1beta is required for 1.5-flash
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.9, responseMimeType: "application/json" }
      })
    });

    const data = await resp.json();

    if (!resp.ok) {
      console.error("GOOGLE ERROR:", data.error?.message);
      return res.status(502).json({ error: data.error?.message, fallback: true });
    }

    const aiText = data.candidates[0].content.parts[0].text;
    return res.status(200).json(JSON.parse(aiText));

  } catch (err) {
    console.error("LOG:", err.message);
    return res.status(500).json({ error: err.message, fallback: true });
  }
}
