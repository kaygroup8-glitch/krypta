import Groq from "groq-sdk";

const groq = new Groq();

const schema = {
  type: "object",
  properties: {
    thesis: { type: "string" },
    supportedBy: { type: "array", items: { type: "string" } },
  },
  required: ["thesis", "supportedBy"],
  additionalProperties: false,
};

const system =
  "You are the Thesis Builder inside KRYPTA, an evidence-first options trading system. " +
  "You may reference only the verified data given to you below. Never invent a price, strike, or any figure not present in that data. " +
  'If the data is insufficient to support any reasonable thesis, respond with thesis exactly equal to "Insufficient verified data." and an empty supportedBy array.';

const user = `Verified data for SPY, expiration 2026-09-19:
Spot price: 765
Long leg: strike 765, ask 12.5
Short leg: strike 770, bid 9.5
Net debit: 300
Max profit: 200
Max loss: 300
Breakeven: 768

Based only on the data above, state a structured thesis for this specific bull call debit spread and list which data points above support it.`;

const completion = await groq.chat.completions.create({
  model: "openai/gpt-oss-20b",
  messages: [
    { role: "system", content: system },
    { role: "user", content: user },
  ],
  response_format: {
    type: "json_schema",
    json_schema: { name: "thesis_output", schema, strict: true },
  },
});

console.log(completion.choices[0]?.message?.content);
