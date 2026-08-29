import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const MCP_SERVER_URL = "http://127.0.0.1:8000/mcp";

export async function callMcpTool(toolName: string, args: Record<string, unknown> = {}) {
  const client = new Client({ name: "krypta-agent", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(new URL(MCP_SERVER_URL));
  await client.connect(transport);

  try {
    return await client.callTool({ name: toolName, arguments: args });
  } finally {
    await client.close();
  }
}
