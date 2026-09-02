import { NextResponse } from "next/server";
import { getOrderHistory } from "@/lib/alpaca/client";

export async function GET() {
  try {
    const orders = await getOrderHistory();
    return NextResponse.json({ connected: true, orders });
  } catch (error) {
    return NextResponse.json({ connected: false, error: (error as Error).message }, { status: 500 });
  }
}
