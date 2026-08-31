import { NextResponse } from "next/server";
import { getOptionChain, getUnderlyingPrice } from "@/lib/alpaca/client";
import { parseOptionSymbol, calculateBullCallDebitSpread } from "@/lib/calc/options";
import { buildThesis } from "@/lib/services/thesis-builder";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") ?? "SPY";

  try {
    const [chain, spotPrice] = await Promise.all([
      getOptionChain(symbol),
      getUnderlyingPrice(symbol),
    ]);

    const snapshots = chain.snapshots ?? {};
    const byExpiration: Record<string, any[]> = {};

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

      const spread = calculateBullCallDebitSpread(sorted[nearestIndex], sorted[nearestIndex + 1]);
      const thesis = await buildThesis({
        symbol,
        spotPrice,
        expiration,
        longLeg: spread.longLeg,
        shortLeg: spread.shortLeg,
        netDebitTotal: spread.netDebitTotal,
        maxProfit: spread.maxProfit,
        maxLoss: spread.maxLoss,
        breakeven: spread.breakeven,
      });

      return NextResponse.json({ connected: true, symbol, expiration, spread, thesis });
    }

    return NextResponse.json({
      connected: true, symbol, spread: null,
      message: "Insufficient verified data to construct a spread from the current chain.",
    });
  } catch (error) {
    return NextResponse.json(
      { connected: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
