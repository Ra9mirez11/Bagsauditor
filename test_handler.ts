import handler from './api/audit.js';
// Mock VercelRequest and VercelResponse
const req = {
  method: 'POST',
  body: { token_mint: 'So11111111111111111111111111111111111111112' }
} as any;

const res = {
  status: (code: number) => {
    console.log("Status:", code);
    return res;
  },
  json: (data: any) => {
    console.log("JSON:", JSON.stringify(data, null, 2));
    return res;
  }
} as any;

async function run() {
  console.log("Running handler test...");
  try {
    await handler(req, res);
  } catch (e) {
    console.error("Handler failed:", e);
  }
}

run();
