import { NextResponse } from "next/server";
import { getAccount } from "@/lib/alpaca/client";

export async function GET() {
  try {
    const account = await getAccount();
    return NextResponse.json({ connected: true, account });
  } catch (error) {
    return NextResponse.json(
      { connected: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
