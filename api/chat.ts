import { VercelRequest, VercelResponse } from '@vercel/node';
import { OpenRouter } from "@openrouter/sdk";

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const { message, context } = request.body;
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return response.status(500).json({ error: 'API key not configured' });
  }

  try {
    const openrouter = new OpenRouter({ apiKey });
    
    const result = await openrouter.chat.send({
      model: "nvidia/nemotron-3-super-120b-a12b:free",
      messages: [
        {
          role: 'user',
          content: `You are a security auditor expert for the Bags ecosystem on Solana. 
          Context: ${JSON.stringify(context)}.
          Focus on security risks, fee distribution, and creator trust.
          
          User's message: ${message}`
        }
      ]
    });

    const reply = result.choices?.[0]?.message?.content || 'I cannot answer that right now.';
    return response.status(200).json({ reply });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return response.status(500).json({ error: error.message });
  }
}
