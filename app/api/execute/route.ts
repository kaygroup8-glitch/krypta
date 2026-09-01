import { NextResponse } from "next/server";
import { placeSpreadOrder } from "@/lib/services/execution";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { longLeg, shortLeg, netDebitPerShare } = body;
    if (!longLeg?.symbol || !shortLeg?.symbol || typeof netDebitPerShare !== "number") {
      return NextResponse.json({ placed: false, error: "Missing required order fields." }, { status: 400 });
    }
    const order = await placeSpreadOrder({ longLeg, shortLeg, netDebitPerShare });
    return NextResponse.json({ placed: true, order });
  } catch (error) {
    return NextResponse.json({ placed: false, error: (error as Error).message }, { status: 500 });
  }
}
