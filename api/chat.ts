import { VercelRequest, VercelResponse } from '@vercel/node';

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
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://bagsauditor.vercel.app",
        "X-Title": "Bags Auditor Sentinel"
      },
      body: JSON.stringify({
        model: "anthropic/claude-3-haiku",
        messages: [
          {
            role: 'system',
            content: `You are a security auditor expert for the Bags ecosystem on Solana. 
            Context: ${JSON.stringify(context)}.
            Focus on security risks, fee distribution, and creator trust.`
          },
          {
            role: 'user',
            content: message
          }
        ]
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`OpenRouter error: ${res.status} ${errorText}`);
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || 'I cannot answer that right now.';

    return response.status(200).json({ reply });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return response.status(500).json({ error: error.message });
  }
}
