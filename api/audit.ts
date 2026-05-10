import { VercelRequest, VercelResponse } from '@vercel/node';
import { PublicKey, Connection } from "@solana/web3.js";

// INLINED BagsService to ensure reliability on Vercel
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
const BAGS_API_BASE = "https://public-api-v2.bags.fm/api/v1";

async function bagsFetch(endpoint: string, apiKey: string) {
  try {
    const url = `${BAGS_API_BASE}/${endpoint}`;
    const response = await fetch(url, {
      headers: { 
        "x-api-key": apiKey,
        "Accept": "application/json"
      }
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.success ? data.response : data;
  } catch (error) {
    return null;
  }
}

async function getAuditData(mint: string, apiKey: string) {
  const [tokenInfo, feesData, creatorsData] = await Promise.all([
    bagsFetch(`token-launch/token/${mint}`, apiKey),
    bagsFetch(`token-launch/lifetime-fees/${mint}`, apiKey),
    bagsFetch(`token-launch/creators/${mint}`, apiKey)
  ]);

  const creators = Array.isArray(creatorsData) ? creatorsData : (creatorsData?.creators || []);
  const fees = Number(feesData?.totalFees || feesData || 0);

  const data = {
    mint,
    name: tokenInfo?.name || "Bags Token",
    symbol: tokenInfo?.symbol || "BAGS",
    fees: fees,
    creators: creators,
  };

  let score = 45;
  if (creators.length > 0) score += 25;
  if (fees > 0.5 * 1e9) score += 20;
  if (data.name !== "Unknown Token") score += 9;
  
  const safetyScore = Math.min(score, 99);
  
  return {
    ...data,
    safetyScore,
    riskLevel: safetyScore > 80 ? 'Low' : safetyScore > 50 ? 'Medium' : 'High',
    analysis: `Audit results for ${data.symbol}. Creators: ${creators.length}. Fees: ${fees / 1e9} SOL.`
  };
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token_mint } = request.body;
    const aiApiKey = process.env.OPENROUTER_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.AI_API_KEY;
    const bagsApiKey = process.env.BAGS_API_KEY || '';

    if (!token_mint) return response.status(400).json({ error: 'token_mint is required' });
    if (!aiApiKey) return response.status(500).json({ error: 'AI API key missing' });

    const tokenData = await getAuditData(token_mint, bagsApiKey);
    
    // AI Analysis call
    const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${aiApiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://bagsauditor.vercel.app",
        "X-Title": "Bags Auditor Sentinel"
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-3-super-120b-a12b:free",
        messages: [
          {
            role: 'user',
            content: `Analyze this Bags Solana token data: ${JSON.stringify(tokenData)}.
            Provide 3 security insights about liquidity, creators, and fee distribution.
            Return ONLY valid JSON: { "insights": ["...", "...", "..."], "recommendation": "SAFE" | "CAUTION" | "DANGER" }`
          }
        ]
      })
    });

    if (!aiRes.ok) {
      return response.status(200).json({
        ...tokenData,
        insights: ["AI currently unavailable", "Basic audit completed", "Check fees manually"],
        recommendation: tokenData.safetyScore > 70 ? 'SAFE' : 'CAUTION'
      });
    }

    const aiJson = await aiRes.json();
    const content = aiJson.choices?.[0]?.message?.content || '{}';
    
    // Clean JSON extraction
    const jsonStart = content.indexOf('{');
    const jsonEnd = content.lastIndexOf('}') + 1;
    const jsonStr = jsonStart !== -1 ? content.slice(jsonStart, jsonEnd) : '{}';
    
    try {
      const parsed = JSON.parse(jsonStr);
      return response.status(200).json({
        ...tokenData,
        insights: parsed.insights || ["No specific insights"],
        recommendation: parsed.recommendation || (tokenData.safetyScore > 70 ? 'SAFE' : 'CAUTION')
      });
    } catch {
      return response.status(200).json({
        ...tokenData,
        insights: [content.substring(0, 100)],
        recommendation: tokenData.safetyScore > 70 ? 'SAFE' : 'CAUTION'
      });
    }

  } catch (error: any) {
    return response.status(500).json({ error: error.message });
  }
}
