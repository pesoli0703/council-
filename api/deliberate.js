/* 
 * Council API — Live AI Deliberation
 * Fixed: Uses v1beta endpoint to resolve "Model not found" errors.
 */

export default async function handler(req, res) {
  // 1. Only allow POST requests (Browsers use GET, which returns 405)
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  // 2. Get and clean the API Key
  const rawKey = process.env.GEMINI_API_KEY || "";
  const apiKey = rawKey.trim();

  if (!apiKey) {
    console.error("LOG: Missing GEMINI_API_KEY in Vercel.");
    return res.status(501).json({ error: "AI not configured in Vercel settings.", fallback: true });
  }

  try {
    const { members, decision } = req.body || {};
    if (!members || !decision) {
      return res.status(400).json({ error: "Missing decision or members data." });
    }

    // 3. Create the prompt for the Board
    const roster = members.map(m => `- ${m.name}: ${m.lens}`).join("\n");
    const prompt = `You are a board of directors.
    USER DECISION: "${decision.question}"
    CONTEXT: "${decision.context || "None"}"
    
    BOARD MEMBERS:
    ${roster}

    INSTRUCTIONS:
    - Give each member 3 sentences of unique, personal advice in their own voice.
    - Be specific to the decision. Do not use generic advice.
    - Return ONLY a JSON object. No markdown, no backticks.
    
    JSON SHAPE:
    {
      "responses": [
        { "memberId": "...", "name": "...", "lean": "go|caution|depends", "confidence": 95, "text": "...", "quote": "..." }
      ],
      "synthesis": { "headline": "...", "direction": "...", "agree": [], "tension": "...", "questions": [] }
    }`;

    // 4. Try the v1beta endpoint (Solves the "Model not found" error)
    const baseUrl = "https://generativelanguage.googleapis.com/v1beta/models";
    
    // We try gemini-1.5-flash first (fast), then gemini-pro (stable)
    const modelsToTry = ["gemini-1.5-flash", "gemini-pro"];
    let lastError = "";
    let finalData = null;

    for (const model of modelsToTry) {
      try {
        const resp = await fetch(`${baseUrl}/${model}:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.8 }
          })
        });

        const data = await resp.json();

        if (resp.ok && data.candidates) {
          finalData = data;
          break; // Success! Stop the loop.
        } else {
          lastError = data.error?.message || "Model failed";
          console.log(`Model ${model} failed: ${lastError}`);
        }
      } catch (e) {
        lastError = e.message;
      }
    }

    if (!finalData) {
      throw new Error(lastError || "All models failed");
    }

    // 5. Clean up the AI text and return it
    let aiText = finalData.candidates[0].content.parts[0].text;
    
    // Remove backticks if the AI added them
    const cleanJson = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    return res.status(200).json(JSON.parse(cleanJson));

  } catch (err) {
    console.error("FINAL API ERROR:", err.message);
    return res.status(500).json({ error: err.message, fallback: true });
  }
}
