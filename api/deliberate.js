export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) return res.status(501).json({ error: "No API Key found in Vercel" });

  try {
    const { members, decision } = req.body;
    const roster = members.map(m => `${m.name}: ${m.lens}`).join("\n");
    const prompt = `You are a board of advisors. Decision: "${decision.question}". 
    Board: ${roster}. 
    Give each member 3 sentences of unique advice. 
    Return ONLY JSON: {"responses": [{"memberId": "...", "name": "...", "lean": "go", "confidence": 90, "text": "...", "quote": "..."}], "synthesis": {"headline": "...", "direction": "...", "agree": [], "tension": "...", "questions": []}}`;

    // We will try these 3 models in order. If one fails, it tries the next.
    const models = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-pro"];
    let lastError = "";

    for (const modelName of models) {
      try {
        // We use v1beta because gemini-1.5-flash often requires it
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
        
        const resp = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.8, responseMimeType: "application/json" }
          })
        });

        const data = await resp.json();

        if (resp.ok && data.candidates) {
          let aiText = data.candidates[0].content.parts[0].text;
          return res.status(200).json(JSON.parse(aiText));
        } else {
          lastError = data.error?.message || "Unknown error";
          console.log(`Model ${modelName} failed, trying next...`);
        }
      } catch (e) {
        lastError = e.message;
      }
    }

    // If we get here, all 3 models failed
    console.error("ALL MODELS FAILED:", lastError);
    return res.status(502).json({ error: lastError, fallback: true });

  } catch (err) {
    return res.status(500).json({ error: "Final crash", fallback: true });
  }
}
