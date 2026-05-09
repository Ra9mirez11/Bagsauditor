import { VercelRequest, VercelResponse } from '@vercel/node';
import { OpenRouter } from "@openrouter/sdk";

const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY || '',
});

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const { message, context } = request.body;

  if (!message) {
    return response.status(400).json({ error: 'Message is required' });
  }

  try {
    const res = await openrouter.chat.send({
      model: "anthropic/claude-3-haiku",
      messages: [
        {
          role: 'system',
          content: `You are a security auditor expert for the Bags ecosystem on Solana. 
          Use the following context about the token being discussed: ${JSON.stringify(context)}.
          Answer user questions concisely and focus on security risks, fee distribution, and creator trust.`
        },
        {
          role: 'user',
          content: message
        }
      ],
    });

    const reply = res.choices[0]?.message?.content || 'I cannot answer that right now.';

    return response.status(200).json({ reply });
  } catch (error: any) {
    console.error(error);
    return response.status(500).json({ error: error.message });
  }
}
