import { NextResponse } from "next/server";
import { closePosition } from "@/lib/alpaca/client";

export async function POST(request: Request) {
  try {
    const { symbol } = await request.json();
    if (!symbol) {
      return NextResponse.json({ closed: false, error: "Missing symbol." }, { status: 400 });
    }
    const order = await closePosition(symbol);
    return NextResponse.json({ closed: true, order });
  } catch (error) {
    return NextResponse.json({ closed: false, error: (error as Error).message }, { status: 500 });
  }
}
