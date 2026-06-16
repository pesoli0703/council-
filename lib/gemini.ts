import { GoogleGenerativeAI } from '@google/generative-ai';
import { Persona } from './personas';

// Initialize the API using your valid key
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

export async function generatePersonaResponse(
  persona: Persona,
  question: string
): Promise<string> {
  try {
    // Using the current stable model for fast and intelligent responses
    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

    const prompt = `You are ${persona.name}, known as a ${persona.title}. 
Your worldview is characterized by: ${persona.worldview}

Respond to the following question from your unique perspective and worldview. 
Be authentic to how ${persona.name} would think and speak.
Keep your response concise but thoughtful (2-3 paragraphs).

Question: ${question}

Respond as ${persona.name}:`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error(`Error generating response for ${persona.name}:`, error);
    throw error;
  }
}

export async function generateBoardResponses(
  personas: Persona[],
  question: string
): Promise<Record<string, string>> {
  const responses: Record<string, string> = {};

  for (const persona of personas) {
    try {
      responses[persona.id] = await generatePersonaResponse(persona, question);
    } catch (error: any) {
      // Prints the actual error directly onto the UI cards if anything fails
      responses[persona.id] = `Error: ${error.message}`;
    }
  }

  return responses;
}
