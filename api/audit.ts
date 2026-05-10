import { VercelRequest, VercelResponse } from '@vercel/node';
import { BagsService } from './lib/bags.js';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const { token_mint } = request.body;
  
  // Support multiple naming conventions for API keys
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.AI_API_KEY;

  if (!token_mint) {
    return response.status(400).json({ error: 'token_mint is required' });
  }

  if (!apiKey) {
    return response.status(500).json({ error: 'AI API key not configured. Please set OPENROUTER_API_KEY.' });
  }

  try {
    const bagsService = new BagsService(process.env.BAGS_API_KEY || 'DEMO');
    console.log(`Auditing mint: ${token_mint}`);
    const tokenData = await bagsService.auditToken(token_mint);
    console.log("Token data fetched successfully");
    const claimEvents = await bagsService.getClaimEvents(token_mint);
    console.log(`Claim events fetched: ${claimEvents.length}`);

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://bagsauditor.vercel.app",
        "X-Title": "Bags Auditor Sentinel"
      },
      body: JSON.stringify({
        model: "anthropic/claude-3.5-sonnet", // Use a high-quality model
        messages: [
          {
            role: 'user',
            content: `Analyze this Bags Solana token data: ${JSON.stringify(tokenData)}.
            Provide 3 security insights about liquidity, creators, and fee distribution.
            Return ONLY a valid JSON object: { "insights": ["...", "...", "..."], "recommendation": "SAFE" | "CAUTION" | "DANGER" }`
          }
        ]
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`OpenRouter Error (${res.status}): ${errorText}`);
    }

    const aiData = await res.json();
    const content = aiData.choices?.[0]?.message?.content || '{}';
    
    let aiAnalysis;
    try {
      // Robust JSON extraction
      const jsonStart = content.indexOf('{');
      const jsonEnd = content.lastIndexOf('}') + 1;
      if (jsonStart !== -1 && jsonEnd !== -1) {
        aiAnalysis = JSON.parse(content.substring(jsonStart, jsonEnd));
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (e) {
      console.error("AI Parse Error:", content);
      aiAnalysis = { insights: ["AI analysis was unreadable", "Manual check recommended", "Data verification required"], recommendation: "CAUTION" };
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
