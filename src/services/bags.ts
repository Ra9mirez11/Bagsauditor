import { BagsSDK } from "@bagsfm/bags-sdk";
import { PublicKey, Connection } from "@solana/web3.js";

const SOLANA_RPC_URL = "https://api.mainnet-beta.solana.com"; // Default public RPC

export class BagsService {
  private sdk: BagsSDK;
  private connection: Connection;

  constructor(apiKey: string) {
    this.connection = new Connection(SOLANA_RPC_URL);
    this.sdk = new BagsSDK(apiKey, this.connection, "processed");
  }

  async getTokenMetadata(mint: string) {
    try {
      const pubkey = new PublicKey(mint);
      // The SDK might have a method for metadata, but we can also fetch from chain
      // For now, let's use what we saw in the docs
      const fees = await this.sdk.state.getTokenLifetimeFees(pubkey);
      const creators = await this.sdk.state.getTokenCreators(pubkey);
      
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
      const events = await this.sdk.state.getTokenClaimEvents(pubkey, {
        mode: "offset",
        limit: 100,
        offset: 0,
      });
      
      return events.map(e => ({
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

  private calculateSafetyScore(data: any) {
    let score = 50; // Base score
    if (data.creators.length > 0) score += 20;
    if (data.fees > 1e9) score += 10; // > 1 SOL in fees
    return Math.min(score, 99);
  }
}
