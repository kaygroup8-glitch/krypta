import { NextResponse } from "next/server";
import { buildOpportunity } from "@/lib/services/opportunity";
import type { RiskBoundary } from "@/lib/risk/gate";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") ?? "SPY";
  const rb = searchParams.get("riskBoundary");
  const riskBoundary: RiskBoundary =
    rb === "conservative" || rb === "balanced" || rb === "aggressive" ? rb : "balanced";

  try {
    const result = await buildOpportunity(symbol, riskBoundary);
    return NextResponse.json({ connected: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { connected: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
