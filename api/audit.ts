import { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { BagsService } from '../src/services/bags';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
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

    // 2. Call Claude AI
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 1000,
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

    // Parse Claude's response (assuming it follows instructions)
    // Note: In production, you'd want better parsing/error handling
    const content = message.content[0].type === 'text' ? message.content[0].text : '{}';
    const aiAnalysis = JSON.parse(content.substring(content.indexOf('{'), content.lastIndexOf('}') + 1));

    return response.status(200).json({
      ...tokenData,
      vulnerabilities: aiAnalysis.insights || [],
      recommendation: aiAnalysis.recommendation || 'UNKNOWN'
    });
  } catch (error: any) {
    console.error(error);
    return response.status(500).json({ error: error.message });
  }
}
