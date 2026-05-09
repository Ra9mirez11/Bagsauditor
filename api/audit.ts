import { VercelRequest, VercelResponse } from '@vercel/node';
import { OpenRouter } from "@openrouter/sdk";
import { BagsService } from '../src/services/bags';

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

  const { token_mint } = request.body;

  if (!token_mint) {
    return response.status(400).json({ error: 'token_mint is required' });
  }

  try {
    // 1. Get Bags Data
    const bagsService = new BagsService(process.env.BAGS_API_KEY || 'DEMO');
    const tokenData = await bagsService.auditToken(token_mint);
    const claimEvents = await bagsService.getClaimEvents(token_mint);

    // 2. Call Claude AI via OpenRouter
    const res = await openrouter.chat.send({
      model: "anthropic/claude-3-haiku",
      messages: [
        {
          role: 'user',
          content: `You are a security auditor for the Bags ecosystem on Solana. 
          Analyze this token data and provide 3 concise security insights:
          ${JSON.stringify(tokenData)}
          
          Return JSON format: { "insights": ["...", "...", "..."], "recommendation": "SAFE" | "CAUTION" | "DANGER" }`
        }
      ],
    });

    const content = res.choices[0]?.message?.content || '{}';
    const aiAnalysis = JSON.parse(content.substring(content.indexOf('{'), content.lastIndexOf('}') + 1));

    return response.status(200).json({
      ...tokenData,
      claimEvents,
      vulnerabilities: aiAnalysis.insights || [],
      recommendation: aiAnalysis.recommendation || 'UNKNOWN'
    });
  } catch (error: any) {
    console.error(error);
    return response.status(500).json({ error: error.message });
  }
}
