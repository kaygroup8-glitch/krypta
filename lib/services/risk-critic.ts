import { generateStructured } from "@/lib/ai/provider";
import { describeLiquidity, type DebitSpreadLeg } from "@/lib/calc/options";
import type { Thesis } from "@/lib/services/thesis-builder";

export interface RiskCritique {
  hasConcerns: boolean;
  concerns: string[];
}

const CRITIQUE_SCHEMA = {
  type: "object",
  properties: {
    hasConcerns: { type: "boolean" },
    concerns: { type: "array", items: { type: "string" } },
  },
  required: ["hasConcerns", "concerns"],
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
    "The quote spread percentage for each leg has already been evaluated against KRYPTA's liquidity threshold and labeled normal or elevated. Raise it as a concern only if it is labeled elevated. " +
    "Also consider missing data, contradictory pricing, strategy mismatch, or weak evidence. " +
    "Set hasConcerns to true only if you list at least one genuine, data grounded concern. If you find none, set hasConcerns to false and return an empty concerns array.";

  const user = `Verified data for ${params.symbol}, expiration ${params.expiration}:
Spot price: ${params.spotPrice}
Long leg: strike ${params.longLeg.strike}, ask ${params.longLeg.askPrice}, bid ${params.longLeg.bidPrice}, quote spread ${describeLiquidity(params.longLeg)}
Short leg: strike ${params.shortLeg.strike}, ask ${params.shortLeg.askPrice}, bid ${params.shortLeg.bidPrice}, quote spread ${describeLiquidity(params.shortLeg)}
Net debit: ${params.netDebitTotal}
Max profit: ${params.maxProfit}
Max loss: ${params.maxLoss}
Breakeven: ${params.breakeven}

Thesis to challenge: ${params.thesis.thesis}
Supported by: ${params.thesis.supportedBy.join("; ")}

Attempt to invalidate this thesis using only the data above.`;

  return generateStructured<RiskCritique>({
    system,
    user,
    schemaName: "risk_critique",
    schema: CRITIQUE_SCHEMA,
  });
}
