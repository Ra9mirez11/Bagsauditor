import { VercelRequest, VercelResponse } from '@vercel/node';
import { BagsService } from '../src/services/bags';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const { token_mint } = request.body;
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!token_mint) {
    return response.status(400).json({ error: 'token_mint is required' });
  }

  if (!apiKey) {
    return response.status(500).json({ error: 'AI API key not configured' });
  }

  try {
    // 1. Get Bags Data
    const bagsService = new BagsService(process.env.BAGS_API_KEY || 'DEMO');
    const tokenData = await bagsService.auditToken(token_mint);
    const claimEvents = await bagsService.getClaimEvents(token_mint);

    // 2. Call Claude AI via OpenRouter fetch
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
            role: 'user',
            content: `You are a security auditor for the Bags ecosystem on Solana. 
            Analyze this token data and provide 3 concise security insights:
            ${JSON.stringify(tokenData)}
            
            Return ONLY a JSON object: { "insights": ["...", "...", "..."], "recommendation": "SAFE" | "CAUTION" | "DANGER" }`
          }
        ]
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`OpenRouter audit error: ${res.status} ${errorText}`);
    }

    const aiData = await res.json();
    const content = aiData.choices?.[0]?.message?.content || '{}';
    
    let aiAnalysis;
    try {
      aiAnalysis = JSON.parse(content.substring(content.indexOf('{'), content.lastIndexOf('}') + 1));
    } catch (e) {
      aiAnalysis = { insights: ["AI Analysis failed to parse"], recommendation: "UNKNOWN" };
    }

    return response.status(200).json({
      ...tokenData,
      claimEvents,
      vulnerabilities: aiAnalysis.insights || [],
      recommendation: aiAnalysis.recommendation || 'UNKNOWN'
    });
  } catch (error: any) {
    console.error("Audit API Error:", error);
    return response.status(500).json({ error: error.message });
  }
}
