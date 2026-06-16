export default async function handler(req, res) {
  // 1. Only allow POST (The app uses POST, browser links use GET)
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(501).json({ error: "Missing Key" });

  try {
    const { members, decision } = req.body;

    // Build the prompt
    const roster = members.map(m => `${m.id}: ${m.name}`).join(", ");
    const prompt = `You are a board of directors. Decision: "${decision.question}". 
    Board: ${roster}.
    
    For EACH member, write 3 sentences of unique advice. 
    Return a JSON object with this EXACT structure:
    {"responses": [{"memberId": "id", "name": "Name", "lean": "go", "confidence": 90, "text": "Advice here", "quote": "Short quote"}], 
     "synthesis": {"headline": "Summary", "direction": "Advice", "agree": ["points"], "tension": "tension", "questions": ["q1"]}}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.9, responseMimeType: "application/json" }
      })
    });

    const data = await response.json();
    const aiText = data.candidates[0].content.parts[0].text;
    
    // Send the clean JSON back to the app
    return res.status(200).json(JSON.parse(aiText));

  } catch (error) {
    console.error("CRASH:", error);
    return res.status(500).json({ error: "AI Failed", fallback: true });
  }
}
