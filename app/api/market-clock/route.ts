import { NextResponse } from "next/server";
import { getMarketClock } from "@/lib/alpaca/client";

export async function GET() {
  try {
    const clock = await getMarketClock();
    return NextResponse.json({ connected: true, clock });
  } catch (error) {
    return NextResponse.json({ connected: false, error: (error as Error).message }, { status: 500 });
  }
}
