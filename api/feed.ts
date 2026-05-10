import { VercelRequest, VercelResponse } from '@vercel/node';
import { BagsService } from './lib/bags.js';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  try {
    const bagsService = new BagsService(process.env.BAGS_API_KEY || 'DEMO');
    const feed = await bagsService.getTokenLaunchFeed();
    return response.status(200).json(feed || []);
  } catch (error: any) {
    console.error("Feed API Error:", error);
    return response.status(500).json({ 
      error: error.message, 
      stack: error.stack 
    });
  }
}
