import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const { message, context } = request.body;
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.AI_API_KEY;

  if (!apiKey) {
    return response.status(500).json({ error: 'AI API key not configured' });
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
        model: "nvidia/nemotron-3-super-120b-a12b:free",
        messages: [
          {
            role: 'system',
            content: "You are a security auditor expert for the Bags ecosystem on Solana. Analyze token data and fee distributions. Be concise and technical."
          },
          {
            role: 'user',
            content: `Context: ${JSON.stringify(context)}\n\nUser Question: ${message}`
          }
        ]
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`OpenRouter Error: ${res.status} ${errorText}`);
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || 'I cannot answer that right now.';
    return response.status(200).json({ reply });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return response.status(500).json({ error: error.message });
  }
}
