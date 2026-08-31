import Groq from "groq-sdk";

const groq = new Groq();

const schema = {
  type: "object",
  properties: {
    concerns: { type: "array", items: { type: "string" } },
  },
  required: ["concerns"],
  additionalProperties: false,
};

const system =
  "You are the Risk Critic inside KRYPTA, an evidence-first options trading system. " +
  "Your only job is to attempt to invalidate the thesis below, using only the verified data it was built from. Never invent a figure not present in that data. " +
  "List specific, concrete concerns such as missing data, contradictory pricing, liquidity concerns, strategy mismatch, or weak evidence. " +
  "If you genuinely find no legitimate concern grounded in the data, return a single concern stating that explicitly rather than inventing one.";

const user = `Verified data for SPY, expiration 2026-09-19:
Spot price: 765
Long leg: strike 765, ask 12.5
Short leg: strike 770, bid 9.5
Net debit: 300
Max profit: 200
Max loss: 300
Breakeven: 768

Thesis to challenge: Bull call debit spread on SPY expiring 2026-09-19: Buy 1 ATM 765 call (ask 12.5) and sell 1 point OTM 770 call (bid 9.5), paying net debit of 300. The trade has a maximum profit of 200 if SPY finishes at or above 770, a maximum loss of 300 if SPY finishes below 765, and a breakeven point of 768 at expiration.
Supported by: Spot price: 765; Long leg: strike 765, ask 12.5; Short leg: strike 770, bid 9.5; Net debit: 300; Max profit: 200; Max loss: 300; Breakeven: 768

Attempt to invalidate this thesis using only the data above. List specific concerns.`;

const completion = await groq.chat.completions.create({
  model: "openai/gpt-oss-20b",
  messages: [
    { role: "system", content: system },
    { role: "user", content: user },
  ],
  response_format: {
    type: "json_schema",
    json_schema: { name: "risk_critique", schema, strict: true },
  },
});

console.log(completion.choices[0]?.message?.content);
