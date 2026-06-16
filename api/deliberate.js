export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  const rawKey = process.env.GEMINI_API_KEY || "";
  const apiKey = rawKey.trim();

  if (!apiKey) {
    return res.status(501).json({ error: "API Key is missing in Vercel settings." });
  }

  try {
    const { members, decision } = req.body;
    const roster = members.map(m => `- ${m.name}: ${m.lens}`).join("\n");

    const prompt = `You are a board of directors. Decision: "${decision.question}".
    Context: ${decision.context || "None"}
    
    For each member below, give 3 sentences of unique advice in their voice.
    Members:
    ${roster}

    Return ONLY raw JSON:
    {
      "responses": [
        { "memberId": "...", "name": "...", "lean": "go", "confidence": 90, "text": "...", "quote": "..." }
      ],
      "synthesis": { "headline": "...", "direction": "...", "agree": [], "tension": "...", "questions": [] }
    }`;

    // SWITCHED TO v1 (Stable) instead of v1beta
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await resp.json();

    if (!resp.ok) {
      // If 1.5-flash fails, try the older but stable gemini-pro
      console.error("1.5-Flash failed, trying gemini-pro...");
      const backupUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`;
      const backupResp = await fetch(backupUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      
      const backupData = await backupResp.json();
      if (!backupResp.ok) {
        throw new Error(backupData.error?.message || "Google API Error");
      }
      data.candidates = backupData.candidates;
    }

    let aiText = data.candidates[0].content.parts[0].text;
    const cleanJson = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    return res.status(200).json(JSON.parse(cleanJson));

  } catch (err) {
    console.error("FINAL ERROR:", err.message);
    return res.status(500).json({ error: err.message, fallback: true });
  }
}
