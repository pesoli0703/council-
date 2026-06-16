export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) return res.status(501).json({ error: "Key missing" });

  try {
    const { members, decision } = req.body;
    const roster = members.map(m => `${m.name}: ${m.lens}`).join("\n");

    const prompt = `You are a board of directors. Decision: "${decision.question}".
    Respond as these members, giving each 3 unique sentences of advice:
    ${roster}

    Return ONLY JSON:
    {"responses": [{"memberId": "...", "name": "...", "lean": "go", "confidence": 90, "text": "...", "quote": "..."}], 
     "synthesis": {"headline": "...", "direction": "...", "agree": [], "tension": "...", "questions": []}}`;

    // THE FIX: Use v1beta and gemini-1.5-flash. This is the most reliable combo.
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await resp.json();

    if (!resp.ok) {
      // Final fallback if flash fails: try gemini-pro on v1beta
      const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
      const fResp = await fetch(fallbackUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const fData = await fResp.json();
      if (!fResp.ok) throw new Error(fData.error?.message || "Google Error");
      data.candidates = fData.candidates;
    }

    let aiText = data.candidates[0].content.parts[0].text;
    aiText = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    return res.status(200).json(JSON.parse(aiText));

  } catch (err) {
    console.error("LOG:", err.message);
    return res.status(500).json({ error: err.message, fallback: true });
  }
}
