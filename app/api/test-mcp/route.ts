import { NextResponse } from "next/server";
import { callMcpTool } from "@/lib/alpaca/mcp-client";

export async function GET() {
  try {
    const result = await callMcpTool("get_account_info", {});
    return NextResponse.json({ connected: true, result });
  } catch (error) {
    return NextResponse.json(
      { connected: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
