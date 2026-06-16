export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(501).json({ error: "API key missing" });

  try {
    const { members, decision } = req.body;
    const roster = members.map(m => `${m.name}: ${m.lens}`).join("\n");

    const prompt = `You are a board of directors. Decision: "${decision.question}".
    Board members: ${roster}.
    
    Instructions: Give each member 3 sentences of unique, personal advice. 
    Return ONLY a JSON object. No markdown, no backticks.
    Shape: {"responses": [{"memberId": "...", "name": "...", "lean": "go", "confidence": 90, "text": "...", "quote": "..."}], "synthesis": {"headline": "...", "direction": "...", "agree": [], "tension": "...", "questions": []}}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.9
        }
      })
    });

    const data = await resp.json();

    // Check if Google sent an error
    if (data.error) {
      console.error("GOOGLE ERROR:", data.error.message);
      return res.status(502).json({ error: data.error.message, fallback: true });
    }

    let aiText = data.candidates[0].content.parts[0].text;
    
    // Clean up text if Gemini adds markdown backticks
    aiText = aiText.replace(/```json/g, "").replace(/```/g, "").trim();

    // Final Parse
    const result = JSON.parse(aiText);
    return res.status(200).json(result);

  } catch (err) {
    console.error("SERVER CRASH:", err);
    return res.status(500).json({ error: "Server Error", fallback: true });
  }
}
