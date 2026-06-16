/* Vercel serverless function — Live Gemini AI deliberator */

export default async function handler(req, res) {
  // 1. Only allow POST requests from your app
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  // 2. Fetch the API Key from your Vercel Environment Variables
  const rawKey = process.env.GEMINI_API_KEY || "";
  const apiKey = rawKey.trim();

  if (!apiKey) {
    console.error("GOOGLE ERROR: GEMINI_API_KEY is missing in Vercel settings.");
    return res.status(501).json({ error: "API key not configured.", fallback: true });
  }

  // 3. Stable model name (1.5-flash is fast and cheap/free)
  const model = "gemini-1.5-flash";

  try {
    const { members, decision } = req.body || {};

    if (!members || !decision) {
      return res.status(400).json({ error: "Missing decision data." });
    }

    // 4. Build a high-quality prompt to ensure unique answers
    const roster = members.map(m => `- ${m.name}: ${m.lens}`).join("\n");
    
    const prompt = `You are "Council", a decision-making assistant.
    The user is asking this question: "${decision.question}"
    Context: "${decision.context || "No extra context"}"
    Stakes: "${decision.stakes || "Medium"}"

    BOARD MEMBERS:
    ${roster}

    INSTRUCTIONS:
    - For EACH member listed above, provide 3-4 sentences of advice.
    - IMPORTANT: Speak directly AS that person. Use their unique tone and worldview.
    - Do not be repetitive. Be specific to the user's question.
    - Each member must have a "lean": "go", "caution", or "depends".

    OUTPUT FORMAT:
    You MUST return ONLY a valid JSON object. No markdown, no backticks.
    Shape:
    {
      "responses": [
        { "memberId": "id", "name": "Name", "lean": "go", "confidence": 95, "text": "Advice...", "quote": "Short quote" }
      ],
      "synthesis": {
        "headline": "...",
        "direction": "...",
        "agree": ["..."],
        "tension": "...",
        "questions": ["..."]
      }
    }`;

    // 5. Call the Google Gemini API
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.9, // Higher temperature = more unique, less repetitive answers
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      })
    });

    const data = await resp.json();

    // 6. Handle Google API errors
    if (!resp.ok) {
      const errorMsg = data.error?.message || "Unknown Google Error";
      console.error("GOOGLE API ERROR:", errorMsg);
      return res.status(502).json({ error: errorMsg, fallback: true });
    }

    // 7. Parse and clean the AI response
    let aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    
    // Sometimes Gemini wraps JSON in ```json ... ``` blocks; this removes them.
    const cleanJson = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    const parsedResult = JSON.parse(cleanJson);

    // 8. Send the smart answers back to your app
    return res.status(200).json(parsedResult);

  } catch (err) {
    console.error("SERVER CRASH:", err.message);
    return res.status(500).json({ error: "Internal Server Error", fallback: true });
  }
}
