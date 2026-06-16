export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("ERROR: GEMINI_API_KEY is missing in Vercel settings.");
    return res.status(501).json({ error: "API key missing", fallback: true });
  }

  // Stable model name
  const model = "gemini-1.5-flash";

  try {
    const { members, decision } = req.body || {};
    const roster = members.map(m => `- ${m.name}: ${m.lens}`).join("\n");

    const prompt = `You are a board of directors. Respond to this decision: "${decision.question}".
    Context: ${decision.context}
    
    For each member below, give 3 sentences of advice in their specific voice.
    Members:
    ${roster}

    Return ONLY raw JSON:
    {
      "responses": [
        { "memberId": "...", "name": "...", "lean": "go", "confidence": 90, "text": "...", "quote": "..." }
      ],
      "synthesis": { "headline": "...", "direction": "...", "agree": [], "tension": "...", "questions": [] }
    }`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, responseMimeType: "application/json" }
      })
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      console.error("GOOGLE API ERROR:", errorText); // This tells us WHY it's failing
      return res.status(502).json({ error: "Google API rejected the request", fallback: true });
    }

    const data = await resp.json();
    let text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    return res.status(200).json(JSON.parse(text));
  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({ error: "Internal Error", fallback: true });
  }
}
