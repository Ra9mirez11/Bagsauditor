import { VercelRequest, VercelResponse } from '@vercel/node';

const BAGS_API_BASE = "https://public-api-v2.bags.fm/api/v1";

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  try {
    const apiKey = process.env.BAGS_API_KEY || '';
    const res = await fetch(`${BAGS_API_BASE}/token-launch/feed`, {
      headers: { 
        "x-api-key": apiKey,
        "Accept": "application/json"
      }
    });

    if (!res.ok) {
      // Fallback data for UI stability
      return response.status(200).json([
        { symbol: 'BAGS', name: 'Bags Official', status: 'LIVE', tokenMint: 'BAGS...' },
        { symbol: 'SOL', name: 'Solana', status: 'ACTIVE', tokenMint: 'So11...' }
      ]);
    }

    const data = await res.json();
    const feed = data.success ? data.response : (Array.isArray(data) ? data : []);
    return response.status(200).json(feed);

  } catch (error: any) {
    return response.status(200).json([]);
  }
}
