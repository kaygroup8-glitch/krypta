import { generateStructured } from "@/lib/ai/provider";
import type { DebitSpreadLeg } from "@/lib/calc/options";

export interface Thesis {
  thesis: string;
  supportedBy: string[];
}

const THESIS_SCHEMA = {
  type: "object",
  properties: {
    thesis: { type: "string" },
    supportedBy: { type: "array", items: { type: "string" } },
  },
  required: ["thesis", "supportedBy"],
  additionalProperties: false,
};

export async function buildThesis(params: {
  symbol: string;
  spotPrice: number;
  expiration: string;
  longLeg: DebitSpreadLeg;
  shortLeg: DebitSpreadLeg;
  netDebitTotal: number;
  maxProfit: number;
  maxLoss: number;
  breakeven: number;
}): Promise<Thesis> {
  const system =
    "You are the Thesis Builder inside KRYPTA, an evidence-first options trading system. " +
    "You may reference only the verified data given to you below. Never invent a price, strike, or any figure not present in that data. " +
    'If the data is insufficient to support any reasonable thesis, respond with thesis exactly equal to "Insufficient verified data." and an empty supportedBy array.';

  const user = `Verified data for ${params.symbol}, expiration ${params.expiration}:
Spot price: ${params.spotPrice}
Long leg: strike ${params.longLeg.strike}, ask ${params.longLeg.askPrice}
Short leg: strike ${params.shortLeg.strike}, bid ${params.shortLeg.bidPrice}
Net debit: ${params.netDebitTotal}
Max profit: ${params.maxProfit}
Max loss: ${params.maxLoss}
Breakeven: ${params.breakeven}

Based only on the data above, state a structured thesis for this specific bull call debit spread and list which data points above support it.`;

  return generateStructured<Thesis>({
    system,
    user,
    schemaName: "thesis_output",
    schema: THESIS_SCHEMA,
  });
}
