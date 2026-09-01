import { getOptionChain, getUnderlyingPrice, getAccount } from "@/lib/alpaca/client";
import { parseOptionSymbol, calculateBullCallDebitSpread, type DebitSpreadLeg } from "@/lib/calc/options";
import { buildThesis } from "@/lib/services/thesis-builder";
import { challengeThesis } from "@/lib/services/risk-critic";
import { evaluateRiskGate, type RiskBoundary } from "@/lib/risk/gate";

export async function buildOpportunity(symbol: string, riskBoundary: RiskBoundary) {
  const chain = await getOptionChain(symbol);
  const spotPrice = await getUnderlyingPrice(symbol);
  const account = await getAccount();

  const snapshots = chain.snapshots ?? {};
  const byExpiration: Record<string, DebitSpreadLeg[]> = {};

  for (const [contractSymbol, data] of Object.entries(snapshots) as [string, any][]) {
    const parsed = parseOptionSymbol(contractSymbol);
    if (parsed.type !== "call") continue;
    const q = data.latestQuote;
    if (!q || q.ap == null || q.bp == null) continue;
    (byExpiration[parsed.expiration] ??= []).push({
      symbol: contractSymbol,
      strike: parsed.strike,
      askPrice: q.ap,
      bidPrice: q.bp,
    });
  }

  for (const expiration of Object.keys(byExpiration).sort()) {
    const sorted = byExpiration[expiration].sort((a, b) => a.strike - b.strike);
    if (sorted.length < 2) continue;

    let nearestIndex = 0;
    let smallestDiff = Infinity;
    sorted.forEach((leg, i) => {
      const diff = Math.abs(leg.strike - spotPrice);
      if (diff < smallestDiff) {
        smallestDiff = diff;
        nearestIndex = i;
      }
    });
    if (nearestIndex >= sorted.length - 1) continue;

    let spread;
    try {
      spread = calculateBullCallDebitSpread(sorted[nearestIndex], sorted[nearestIndex + 1]);
    } catch {
      continue;
    }

    const thesis = await buildThesis({
      symbol, spotPrice, expiration,
      longLeg: spread.longLeg, shortLeg: spread.shortLeg,
      netDebitTotal: spread.netDebitTotal, maxProfit: spread.maxProfit,
      maxLoss: spread.maxLoss, breakeven: spread.breakeven,
    });

    const critique = await challengeThesis({
      symbol, spotPrice, expiration,
      longLeg: spread.longLeg, shortLeg: spread.shortLeg,
      netDebitTotal: spread.netDebitTotal, maxProfit: spread.maxProfit,
      maxLoss: spread.maxLoss, breakeven: spread.breakeven,
      thesis,
    });

    const riskGate = evaluateRiskGate({
      account,
      spread: {
        longLeg: spread.longLeg, shortLeg: spread.shortLeg,
        netDebitTotal: spread.netDebitTotal, maxLoss: spread.maxLoss,
      },
      riskBoundary,
    });

    const decision: "EXECUTE" | "WAIT" | "REJECT" = !riskGate.passed
      ? "REJECT"
      : critique.hasConcerns
      ? "WAIT"
      : "EXECUTE";

    return { symbol, spotPrice, expiration, spread, thesis, critique, riskGate, decision };
  }

  return {
    insufficientData: true,
    message: "Insufficient verified data to construct a spread from the current chain.",
  };
}
