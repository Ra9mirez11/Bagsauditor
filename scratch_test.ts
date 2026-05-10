import { BagsService } from './src/services/bags.js';

async function test() {
  const service = new BagsService('DEMO');
  console.log("Testing getTokenMetadata...");
  try {
    const data = await service.getTokenMetadata("So11111111111111111111111111111111111111112");
    console.log("Data result:", JSON.stringify(data, null, 2));
    
    console.log("Testing getClaimEvents...");
    const events = await service.getClaimEvents("So11111111111111111111111111111111111111112");
    console.log("Events count:", events.length);
  } catch (e) {
    console.error("Test failed:", e);
  }
}

test();
