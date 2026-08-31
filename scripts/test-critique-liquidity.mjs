import Groq from "groq-sdk";

const groq = new Groq();

function describeLiquidity(ask, bid) {
  const mid = (ask + bid) / 2;
  const spreadPercent = mid > 0 ? ((ask - bid) / mid) * 100 : 0;
  const flag = spreadPercent > 8 ? "elevated" : "normal";
  return `${spreadPercent.toFixed(1)}% (${flag}, threshold 8%)`;
}

const schema = {
  type: "object",
  properties: { concerns: { type: "array", items: { type: "string" } } },
  required: ["concerns"],
  additionalProperties: false,
};

const system =
  "You are the Risk Critic inside KRYPTA, an evidence-first options trading system. " +
  "Your only job is to attempt to invalidate the thesis below, using only the verified data it was built from. Never invent a figure not present in that data. " +
  "The quote spread percentage for each leg has already been evaluated against KRYPTA's liquidity threshold and labeled normal or elevated. Raise it as a concern only if it is labeled elevated. " +
  "Also consider missing data, contradictory pricing, strategy mismatch, or weak evidence. " +
  "If you genuinely find no legitimate concern grounded in the data, return a single concern stating that explicitly rather than inventing one.";

const user = `Verified data for SPY, expiration 2026-09-19:
Spot price: 765
Long leg: strike 765, ask 12.5, bid 12.2, quote spread ${describeLiquidity(12.5, 12.2)}
Short leg: strike 770, bid 7.0, ask 9.5, quote spread ${describeLiquidity(9.5, 7.0)}
Net debit: 300
Max profit: 200
Max loss: 300
Breakeven: 768

Thesis to challenge: Bull call debit spread on SPY expiring 2026-09-19, buying the 765 call and selling the 770 call for a net debit of 300.
Supported by: Spot price 765; long leg strike 765; short leg strike 770; net debit 300.

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
