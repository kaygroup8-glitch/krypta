import { generateStructured } from "@/lib/ai/provider";
import { describeLiquidity, type DebitSpreadLeg } from "@/lib/calc/options";
import type { Thesis } from "@/lib/services/thesis-builder";

export interface RiskCritique {
  concerns: string[];
  dataLimitations: string[];
  hasConcerns: boolean;
}

const CRITIQUE_SCHEMA = {
  type: "object",
  properties: {
    concerns: { type: "array", items: { type: "string" } },
    dataLimitations: { type: "array", items: { type: "string" } },
    hasConcerns: { type: "boolean" },
  },
  required: ["concerns", "dataLimitations", "hasConcerns"],
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
    "Your job is to attempt to invalidate the thesis below, using only the verified data it was built from. Never invent a figure not present in that data. " +
    "Separate two different things. CONCERNS are specific, actionable problems with this particular trade or its data, a crossed quote, an inconsistent number, a liquidity spread already labeled elevated, a genuine strategy mismatch. DATA LIMITATIONS are structural facts about what this data feed never includes, no implied volatility, no market depth, true of every trade on this tier and not, by themselves, a reason to distrust this specific one. " +
    "The quote spread percentage for each leg has already been evaluated against KRYPTA's liquidity threshold and labeled normal or elevated. Only put it in concerns if it is labeled elevated. " +
    "Set hasConcerns to true only if concerns contains at least one genuine, specific, actionable issue. Routine data limitations belong only in dataLimitations, never in concerns, and never make hasConcerns true by themselves.";

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
