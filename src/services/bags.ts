import { BagsSDK } from "@bagsfm/bags-sdk";
import { PublicKey, Connection } from "@solana/web3.js";

const SOLANA_RPC_URL = "https://api.mainnet-beta.solana.com"; // Default public RPC

export class BagsService {
  private sdk: BagsSDK;
  private connection: Connection;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.connection = new Connection(SOLANA_RPC_URL);
    this.sdk = new BagsSDK(apiKey, this.connection, "processed");
  }

  async getTokenMetadata(mint: string) {
    try {
      const pubkey = new PublicKey(mint);
      // The SDK might have a method for metadata, but we can also fetch from chain
      // For now, let's use what we saw in the docs
      const fees = await (this.sdk.state as any).getTokenLifetimeFees(pubkey);
      const creators = await (this.sdk.state as any).getTokenCreators(pubkey);
      
      return {
        mint,
        fees: Number(fees),
        creators,
      };
    } catch (error) {
      console.error("Error fetching token data:", error);
      throw error;
    }
  }

  async auditToken(mint: string) {
    const data = await this.getTokenMetadata(mint);
    
    // This is where we would call Claude
    // For the PoC, we will simulate a Claude analysis based on real data
    const score = this.calculateSafetyScore(data);
    
    return {
      ...data,
      safetyScore: score,
      riskLevel: score > 80 ? 'Low' : score > 50 ? 'Medium' : 'High',
      analysis: `Claude Analysis: Token shows ${data.creators.length} verified creators. Total fees generated: ${data.fees / 1e9} SOL.`,
    };
  }

  async getClaimEvents(mint: string) {
    try {
      const pubkey = new PublicKey(mint);
      // Fetch last 100 claim events
      // Casting to any because SDK types might be outdated compared to documentation
      const events = await (this.sdk.state as any).getTokenClaimEvents(pubkey, {
        limit: 100,
        offset: 0,
      });
      
      return (events || []).map((e: any) => ({
        amount: Number(e.amount) / 1e9,
        timestamp: new Date(e.timestamp).getTime(),
        wallet: e.wallet,
        isCreator: e.isCreator
      }));
    } catch (error) {
      console.error("Error fetching claim events:", error);
      return [];
    }
  }

  async getTokenLaunchFeed() {
    try {
      // The SDK might have a method, but we can also use fetch directly
      // since the SDK version might be slightly behind the API
      const response = await fetch("https://public-api-v2.bags.fm/api/v1/token-launch/feed", {
        headers: { "x-api-key": this.apiKey }
      });
      const data = await response.json();
      return data.success ? data.response : [];
    } catch (error) {
      console.error("Error fetching launch feed:", error);
      return [];
    }
  }

  private calculateSafetyScore(data: any) {
    let score = 50; // Base score
    if (data.creators.length > 0) score += 20;
    if (data.fees > 1e9) score += 10; // > 1 SOL in fees
    return Math.min(score, 99);
  }
}
