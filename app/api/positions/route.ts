import { NextResponse } from "next/server";
import { getPositions } from "@/lib/alpaca/client";

export async function GET() {
  try {
    const positions = await getPositions();
    return NextResponse.json({ connected: true, positions });
  } catch (error) {
    return NextResponse.json({ connected: false, error: (error as Error).message }, { status: 500 });
  }
}
