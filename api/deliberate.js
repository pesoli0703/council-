export default async function handler(req, res) {
  console.log("--- SYSTEM START: VERSION 4.0 (v1beta) ---");
  
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) return res.status(501).json({ error: "No API Key" });

  try {
    const { members, decision } = req.body;
    const roster = members.map(m => `${m.name}: ${m.lens}`).join("\n");
    const prompt = `You are a board of directors. Decision: "${decision.question}". Context: ${decision.context}. 
    Give each member 3 sentences of unique advice. 
    Return ONLY JSON: {"responses": [{"memberId": "...", "name": "...", "lean": "go", "confidence": 90, "text": "...", "quote": "..."}], "synthesis": {"headline": "...", "direction": "...", "agree": [], "tension": "...", "questions": []}}`;

    // THE URL MUST BE v1beta FOR FLASH
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    console.log("LOG: Attempting v1beta call...");

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
      console.error("GOOGLE REJECTED US:", data.error?.message);
      return res.status(502).json({ error: data.error?.message });
    }

    const aiText = data.candidates[0].content.parts[0].text;
    return res.status(200).json(JSON.parse(aiText));

  } catch (err) {
    console.error("CRASH ERROR:", err.message);
    return res.status(500).json({ error: err.message, fallback: true });
  }
}
