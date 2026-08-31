import { generateStructured } from "@/lib/ai/provider";
import type { DebitSpreadLeg } from "@/lib/calc/options";
import type { Thesis } from "@/lib/services/thesis-builder";

export interface RiskCritique {
  concerns: string[];
}

const CRITIQUE_SCHEMA = {
  type: "object",
  properties: {
    concerns: { type: "array", items: { type: "string" } },
  },
  required: ["concerns"],
  additionalProperties: false,
};

export async function challengeThesis(params: {
  symbol: string;
  spotPrice: number;
  expiration: string;
  longLeg: DebitSpreadLeg;
  shortLeg: DebitSpreadLeg;
  netDebitTotal: number;
  maxProfit: number;
  maxLoss: number;
  breakeven: number;
  thesis: Thesis;
}): Promise<RiskCritique> {
  const system =
    "You are the Risk Critic inside KRYPTA, an evidence-first options trading system. " +
    "Your only job is to attempt to invalidate the thesis below, using only the verified data it was built from. Never invent a figure not present in that data. " +
    "List specific, concrete concerns such as missing data, contradictory pricing, liquidity concerns, strategy mismatch, or weak evidence. " +
    "If you genuinely find no legitimate concern grounded in the data, return a single concern stating that explicitly rather than inventing one.";

  const user = `Verified data for ${params.symbol}, expiration ${params.expiration}:
Spot price: ${params.spotPrice}
Long leg: strike ${params.longLeg.strike}, ask ${params.longLeg.askPrice}
Short leg: strike ${params.shortLeg.strike}, bid ${params.shortLeg.bidPrice}
Net debit: ${params.netDebitTotal}
Max profit: ${params.maxProfit}
Max loss: ${params.maxLoss}
Breakeven: ${params.breakeven}

Thesis to challenge: ${params.thesis.thesis}
Supported by: ${params.thesis.supportedBy.join("; ")}

Attempt to invalidate this thesis using only the data above. List specific concerns.`;

  return generateStructured<RiskCritique>({
    system,
    user,
    schemaName: "risk_critique",
    schema: CRITIQUE_SCHEMA,
  });
}
