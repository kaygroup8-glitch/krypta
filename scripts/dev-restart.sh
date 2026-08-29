#!/bin/bash
pkill -f "next dev" 2>/dev/null
pkill -f "next-server" 2>/dev/null
pkill -f "uvicorn" 2>/dev/null
pkill -f "test-mcp.mjs" 2>/dev/null
sleep 1

export PATH="$HOME/.local/bin:$PATH"
nohup uvx alpaca-mcp-server --transport streamable-http --host 127.0.0.1 --port 8000 --env-file .env.local > /tmp/mcp.log 2>&1 &
nohup npm run dev > /tmp/nextjs.log 2>&1 &

sleep 8
echo "--- MCP server log ---"
tail -15 /tmp/mcp.log
echo "--- Next.js log ---"
tail -15 /tmp/nextjs.log
echo "--- Test ---"
curl -s http://localhost:3000/api/test-mcp
echo ""
