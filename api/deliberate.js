export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) return res.status(501).json({ error: "Missing API Key in Vercel" });

  try {
    const { members, decision } = req.body;
    const roster = members.map(m => `${m.name}: ${m.lens}`).join("\n");

    const prompt = `Act as a board of advisors for this decision: "${decision.question}".
    Context: ${decision.context || "None"}.
    For these members: ${roster}, give each 3 sentences of unique advice. 
    Return ONLY JSON: {"responses": [{"memberId": "...", "name": "...", "lean": "go", "confidence": 90, "text": "...", "quote": "..."}], "synthesis": {"headline": "...", "direction": "...", "agree": [], "tension": "...", "questions": []}}`;

    // This is the most stable URL for Gemini Pro
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await resp.json();

    if (!resp.ok) {
      console.error("GOOGLE ERROR:", data.error?.message);
      return res.status(502).json({ error: data.error?.message });
    }

    let aiText = data.candidates[0].content.parts[0].text;
    const cleanJson = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    return res.status(200).json(JSON.parse(cleanJson));
  } catch (err) {
    console.error("CRASH:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
