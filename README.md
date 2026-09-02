# KRYPTA

**Prove the trade before you place it.**

KRYPTA is an evidence-first AI options trading intelligence system built for the Alpaca AI Trading Agents Hackathon (lablab.ai x Alpaca, August 28 to September 4, 2026).

It does not simply ask an AI "should I buy this stock." It builds a structured thesis from verified market data, actively tries to invalidate that thesis, calculates the proposed options strategy deterministically, checks it against hard risk constraints, and only then allows a human to approve paper execution through Alpaca.

## The core loop

OBSERVE -> EVIDENCE -> THESIS -> CHALLENGE -> STRATEGY -> RISK GATE -> HUMAN APPROVAL -> PAPER EXECUTION -> JOURNAL
Every step in that loop is real. Nothing is simulated or demo data. If verified data is not available, KRYPTA says so plainly rather than fabricating a number.

## Why this is different

Most AI trading agents focus on making the agent act. KRYPTA focuses on making the agent justify the action before it happens. The Thesis Builder and the Risk Critic are two separate AI calls with two separate jobs, one builds a case, the other tries to tear it down, and neither one can execute anything on its own.

## Hackathon requirements

- **Autonomous agents using the Alpaca Trading API**: real REST integration, account data, option chains, live quotes, order placement, order history, and position closing all call Alpaca directly.
- **MCP or CLI**: the official Alpaca MCP server runs alongside the app and is used as a genuine second integration path, proven end to end with real account data returned through it.
- **Options trading**: every strategy KRYPTA proposes is a defined-risk bull call debit spread, calculated deterministically from real bid and ask prices, never estimated by the AI.

## What KRYPTA actually does

1. **Overview**: your real Alpaca paper account, live positions, and your chosen risk boundary.
2. **Opportunity**: enter a ticker, KRYPTA walks through Observe, Evidence, Thesis, Challenge, Strategy, and Risk Gate as separate stages, then a Summary, then a Decision, EXECUTE, WAIT, or REJECT.
3. **Approval**: the execution boundary. Nothing is placed without an explicit tap here. A WAIT decision can be overridden by the user after acknowledging the specific concerns raised, a REJECT cannot, since that reflects a hard, deterministic constraint rather than a judgment call.
4. **Trade History**: every real order pulled live from Alpaca, expandable to show the original reasoning, evidence, risk checks, and current unrealized result behind it.
5. **Journal**: a local record of every decision KRYPTA has made and why.

## No hallucination policy

KRYPTA never invents a price, a Greek, a balance, or an order result. Deterministic application code is the source of truth for every calculated number, max profit, max loss, breakeven, and quote spread. The AI only interprets verified inputs it is explicitly given, and its outputs are constrained to a strict JSON schema, not free text.

## Tech stack

- Next.js (App Router), TypeScript, Tailwind CSS v4
- Alpaca Trading API and Market Data API (paper environment only)
- Alpaca MCP Server (official)
- Groq (openai/gpt-oss-20b) for the Thesis Builder and Risk Critic, structured JSON schema output
- No database, anything that needs to persist locally uses the browser's own storage

## Running locally

Requires Node 18+, and for the MCP server specifically, Python 3.10+ and `uv`.

To also run the MCP server, in a separate terminal:
uvx alpaca-mcp-server --transport streamable-http --host 127.0.0.1 --port 8000 --env-file .env.local

## Safety

Paper trading only. Every request in this codebase points at Alpaca's paper API. No path in this application can place a live order. Nothing in KRYPTA is financial advice.

## Status

Built solo, from an Android phone, for the Alpaca AI Trading Agents Hackathon.
