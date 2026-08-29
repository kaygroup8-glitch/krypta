import { NextResponse } from "next/server";
import { getOptionChain } from "@/lib/alpaca/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") ?? "SPY";

  try {
    const chain = await getOptionChain(symbol);
    return NextResponse.json({
      connected: true,
      symbol,
      topLevelKeys: Object.keys(chain),
      raw: chain,
    });
  } catch (error) {
    return NextResponse.json(
      { connected: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
