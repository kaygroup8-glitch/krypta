import { NextResponse } from "next/server";
import { getAccount } from "@/lib/alpaca/client";

export async function GET() {
  try {
    const account = await getAccount();
    return NextResponse.json({
      connected: true,
      status: account.status,
      optionsTradingLevel: account.options_trading_level,
      paper: true,
    });
  } catch (error) {
    return NextResponse.json(
      { connected: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
