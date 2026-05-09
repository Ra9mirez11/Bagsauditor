import { VercelRequest, VercelResponse } from '@vercel/node';
import { BagsService } from '../src/services/bags';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  try {
    const bagsService = new BagsService(process.env.BAGS_API_KEY || 'DEMO');
    const feed = await bagsService.getTokenLaunchFeed();
    return response.status(200).json(feed);
  } catch (error: any) {
    return response.status(500).json({ error: error.message });
  }
}
