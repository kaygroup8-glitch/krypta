"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { getStoredRiskBoundary, type RiskBoundary } from "@/lib/storage/preferences";
import { pickRandomTickers } from "@/lib/data/tickers";
import { playConfirmTone } from "@/lib/sound/confirm";

interface AccountData {
  status: string;
  portfolio_value: string;
  buying_power: string;
  options_approved_level: number;
}

interface Position {
  symbol: string;
  qty: string;
  side: string;
  avg_entry_price: string;
  current_price: string;
  unrealized_pl: string;
}

const RISK_LABELS: Record<RiskBoundary, string> = {
  conservative: "Conservative",
  balanced: "Balanced",
  aggressive: "Aggressive",
};

export default function Overview() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [symbol, setSymbol] = useState("SPY");
  const [quickStarts, setQuickStarts] = useState<string[]>([]);
  const [riskBoundary, setRiskBoundary] = useState<RiskBoundary>("balanced");
  const [account, setAccount] = useState<AccountData | null>(null);
  const [accountError, setAccountError] = useState(false);
  const [positions, setPositions] = useState<Position[] | null>(null);
  const [positionsError, setPositionsError] = useState(false);
  const [refreshingPositions, setRefreshingPositions] = useState(false);
  const [closingSymbol, setClosingSymbol] = useState<string | null>(null);
  const [closeResult, setCloseResult] = useState<{ symbol: string; ok: boolean; message: string } | null>(null);

  const loadPositions = useCallback(() => {
    setRefreshingPositions(true);
    setPositionsError(false);
    fetch("/api/positions")
      .then((res) => res.json())
      .then((data) => {
        if (data.connected) setPositions(data.positions);
        else setPositionsError(true);
      })
      .catch(() => setPositionsError(true))
      .finally(() => setRefreshingPositions(false));
  }, []);

  useEffect(() => {
    setMounted(true);
    setQuickStarts(pickRandomTickers(4));
    setRiskBoundary(getStoredRiskBoundary());
    fetch("/api/account")
      .then((res) => res.json())
      .then((data) => {
        if (data.connected) setAccount(data.account);
        else setAccountError(true);
      })
      .catch(() => setAccountError(true));
    loadPositions();
  }, [loadPositions]);

  function checkOpportunity(e: React.FormEvent) {
    e.preventDefault();
    if (!symbol.trim()) return;
    router.push(`/opportunity?symbol=${encodeURIComponent(symbol.trim().toUpperCase())}`);
  }

  async function handleClose(posSymbol: string) {
    setClosingSymbol(posSymbol);
    setCloseResult(null);
    try {
      const res = await fetch("/api/positions/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: posSymbol }),
      });
      const body = await res.json();
      if (body.closed) playConfirmTone();
      setCloseResult({ symbol: posSymbol, ok: body.closed, message: body.closed ? "Close order submitted." : body.error });
    } catch (error) {
      setCloseResult({ symbol: posSymbol, ok: false, message: (error as Error).message });
    } finally {
      setClosingSymbol(null);
      loadPositions();
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center px-6 py-16">
      <div className="container-fluid">
        <div data-mounted={mounted} className="reveal-fade flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
            <span className="text-sm font-medium tracking-[0.2em] text-muted uppercase">Krypta</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/journal" className="text-sm text-muted transition-colors hover:text-foreground">Journal</Link>
            <Link href="/trade-history" className="text-sm text-muted transition-colors hover:text-foreground">History</Link>
            <span className="rounded-full border border-border px-3 py-1 font-mono text-xs uppercase tracking-[0.1em] text-muted">Paper</span>
          </div>
        </div>

        <h1 data-mounted={mounted} style={{ animationDelay: "75ms" }} className="reveal text-fluid-h1 mt-8 font-medium tracking-tight">
          Overview
        </h1>

        <section data-mounted={mounted} style={{ animationDelay: "150ms" }} className="reveal mt-8 rounded-2xl border border-border bg-surface p-6">
          <h2 className="font-mono text-xs uppercase tracking-[0.15em] text-accent">Market State</h2>
          <p className="mt-1 text-xs text-muted">Your real Alpaca paper account, fetched live on every visit.</p>
          {accountError && <p className="mt-3 text-sm text-muted">Alpaca connection required.</p>}
          {!accountError && !account && <p className="mt-3 text-sm text-muted">Checking account...</p>}
          {account && (
            <dl className="mt-3 space-y-2 font-mono text-sm">
              <div className="flex items-center justify-between"><dt className="text-muted">Status</dt><dd>{account.status}</dd></div>
              <div className="flex items-center justify-between"><dt className="text-muted">Portfolio value</dt><dd>${parseFloat(account.portfolio_value).toLocaleString()}</dd></div>
              <div className="flex items-center justify-between"><dt className="text-muted">Buying power</dt><dd>${parseFloat(account.buying_power).toLocaleString()}</dd></div>
              <div className="flex items-center justify-between"><dt className="text-muted">Options level</dt><dd>{account.options_approved_level}</dd></div>
            </dl>
          )}
        </section>

        <section data-mounted={mounted} style={{ animationDelay: "225ms" }} className="reveal mt-4 rounded-2xl border border-border bg-surface p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-mono text-xs uppercase tracking-[0.15em] text-accent">Positions</h2>
            <button type="button" onClick={loadPositions} disabled={refreshingPositions} className="text-xs text-muted transition-colors hover:text-foreground disabled:opacity-50">
              {refreshingPositions ? "Refreshing..." : "Refresh"}
            </button>
          </div>
          <p className="mt-1 text-xs text-muted">Each leg of a spread is its own line, that&apos;s how Alpaca reports options.</p>
          {positionsError && <p className="mt-3 text-sm text-muted">Alpaca connection required.</p>}
          {!positionsError && positions === null && <p className="mt-3 text-sm text-muted">Checking positions...</p>}
          {positions && positions.length === 0 && <p className="mt-3 text-sm text-muted">Nothing open right now.</p>}
          {positions && positions.length > 0 && (
            <ul className="mt-3 space-y-3">
              {positions.map((p) => {
                const pl = parseFloat(p.unrealized_pl);
                return (
                  <li key={p.symbol} className="flex items-center justify-between font-mono text-sm">
                    <span>{p.symbol} · {p.side} {p.qty}</span>
                    <span className="flex items-center gap-3">
                      <span className={pl >= 0 ? "text-confirm" : "text-risk"}>{pl >= 0 ? "+" : ""}${pl.toFixed(2)}</span>
                      <button
                        type="button"
                        onClick={() => handleClose(p.symbol)}
                        disabled={closingSymbol === p.symbol}
                        className="text-xs text-muted underline decoration-dotted transition-colors hover:text-risk disabled:opacity-50"
                      >
                        {closingSymbol === p.symbol ? "Closing..." : "Close"}
                      </button>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          {closeResult && (
            <p className={`mt-3 text-xs ${closeResult.ok ? "text-confirm" : "text-risk"}`}>
              {closeResult.symbol}: {closeResult.message}
            </p>
          )}
        </section>

        <section data-mounted={mounted} style={{ animationDelay: "300ms" }} className="reveal mt-4 rounded-2xl border border-border bg-surface p-6">
          <h2 className="font-mono text-xs uppercase tracking-[0.15em] text-accent">Risk Status</h2>
          <p className="mt-3 text-sm text-muted">
            Boundary set to <span className="text-foreground">{RISK_LABELS[riskBoundary]}</span>. Every proposed trade is checked against this before it can reach you.
          </p>
        </section>

        <section data-mounted={mounted} style={{ animationDelay: "375ms" }} className="reveal mt-4 rounded-2xl border border-border bg-surface p-6">
          <h2 className="font-mono text-xs uppercase tracking-[0.15em] text-accent">What are you looking at?</h2>
          <form onSubmit={checkOpportunity} className="mt-4 flex gap-2">
            <input
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="SPY"
              className="flex-1 rounded-xl border border-border bg-background px-4 py-3 font-mono text-sm uppercase text-foreground outline-none focus-visible:border-accent"
            />
            <button type="submit" className="inline-flex items-center justify-center rounded-xl bg-accent px-5 py-3 text-sm font-medium text-background transition-transform duration-150 ease-out hover:brightness-110 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
              Check
            </button>
          </form>
          <p className="mt-3 text-xs uppercase tracking-[0.1em] text-muted">Quick starts</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {quickStarts.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => router.push(`/opportunity?symbol=${t}`)}
                className="rounded-full border border-border px-3 py-1.5 font-mono text-xs text-muted transition-colors hover:border-accent hover:text-accent"
              >
                {t}
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
