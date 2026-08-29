import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const client = new Client({ name: "krypta-agent", version: "1.0.0" });
const transport = new StreamableHTTPClientTransport(new URL("http://127.0.0.1:8000/mcp"));

await client.connect(transport);
const tools = await client.listTools();
console.log("Connected. Tool count:", tools.tools.length);
console.log(tools.tools.slice(0, 10).map((t) => t.name));
