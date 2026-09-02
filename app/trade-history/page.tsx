"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getJournalEntries, type JournalEntry } from "@/lib/storage/journal";

interface OrderLeg {
  symbol: string;
  side: string;
  ratio_qty: string;
}

interface Order {
  id: string;
  symbol: string;
  order_class: string;
  status: string;
  submitted_at: string;
  filled_at: string | null;
  legs?: OrderLeg[] | null;
}

interface Position {
  symbol: string;
  unrealized_pl: string;
}

const STATUS_STYLE: Record<string, string> = {
  filled: "text-confirm",
  canceled: "text-muted",
  expired: "text-muted",
  rejected: "text-risk",
};

export default function TradeHistory() {
  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    setJournal(getJournalEntries());
    fetch("/api/trade-history").then((res) => res.json()).then((data) => {
      if (data.connected) setOrders(data.orders);
      else setError(data.error ?? "Alpaca connection required.");
    }).catch(() => setError("Alpaca connection required."));
    fetch("/api/positions").then((res) => res.json()).then((data) => {
      if (data.connected) setPositions(data.positions);
    }).catch(() => {});
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center px-6 py-16">
      <div className="container-fluid">
        <Link href="/overview" data-mounted={mounted} className="reveal-fade text-sm text-muted transition-colors hover:text-foreground">← Overview</Link>
        <h1 data-mounted={mounted} style={{ animationDelay: "75ms" }} className="reveal text-fluid-h1 mt-8 font-medium tracking-tight">Trade History</h1>
        <p data-mounted={mounted} style={{ animationDelay: "150ms" }} className="reveal mt-4 text-sm text-muted">Real orders from Alpaca. Tap one to see why KRYPTA entered it.</p>

        {error && <p className="mt-8 text-sm text-muted">{error}</p>}
        {!error && orders === null && <p className="mt-8 text-sm text-muted">Loading order history...</p>}
        {orders && orders.length === 0 && <p className="mt-8 text-sm text-muted">No orders submitted yet.</p>}

        <div className="mt-8 flex flex-col gap-3">
          {orders?.map((order, i) => {
            const entry = journal.find((j) => j.orderId === order.id);
            const isOpen = expanded === order.id;
            return (
              <section key={order.id} data-mounted={mounted} style={{ animationDelay: `${225 + i * 50}ms` }} className="reveal cursor-pointer rounded-2xl border border-border bg-surface p-6" onClick={() => setExpanded(isOpen ? null : order.id)}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-mono text-sm">{order.symbol} · {order.order_class}</p>
                  <span className={`font-mono text-xs uppercase tracking-[0.1em] ${STATUS_STYLE[order.status] ?? "text-muted"}`}>{order.status}</span>
                </div>
                {order.legs?.map((leg) => <p key={leg.symbol} className="mt-1 font-mono text-xs text-muted">{leg.side} {leg.ratio_qty} · {leg.symbol}</p>)}
                <p className="mt-2 text-xs text-muted">
                  Submitted {new Date(order.submitted_at).toLocaleString()}
                  {order.filled_at && ` · Filled ${new Date(order.filled_at).toLocaleString()}`}
                </p>

                {isOpen && (
                  <div className="mt-4 border-t border-border pt-4" onClick={(e) => e.stopPropagation()}>
                    {!entry && <p className="text-sm text-muted">No decision record linked to this order.</p>}
                    {entry && (
                      <>
                        <h3 className="text-xs uppercase tracking-[0.1em] text-accent">Why we entered</h3>
                        <p className="mt-2 text-sm leading-relaxed">{entry.thesis}</p>

                        <h3 className="mt-4 text-xs uppercase tracking-[0.1em] text-muted">Evidence considered</h3>
                        <ul className="mt-1.5 space-y-1 text-sm text-muted">{entry.evidence.map((e, j) => <li key={j}>{e}</li>)}</ul>

                        <h3 className="mt-4 text-xs uppercase tracking-[0.1em] text-muted">What could invalidate it</h3>
                        {entry.concerns.length > 0 ? (
                          <ul className="mt-1.5 space-y-1 text-sm text-muted">{entry.concerns.map((c, j) => <li key={j}>{c}</li>)}</ul>
                        ) : <p className="mt-1.5 text-sm text-muted">No specific concerns were raised.</p>}

                        {entry.riskGateChecks && (
                          <>
                            <h3 className="mt-4 text-xs uppercase tracking-[0.1em] text-muted">Risk checks</h3>
                            <ul className="mt-1.5 space-y-1.5 text-sm">
                              {entry.riskGateChecks.map((c) => (
                                <li key={c.name} className="flex items-start gap-2">
                                  <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${c.passed ? "bg-confirm" : "bg-risk"}`} aria-hidden="true" />
                                  <span>{c.name}</span>
                                </li>
                              ))}
                            </ul>
                          </>
                        )}

                        <h3 className="mt-4 text-xs uppercase tracking-[0.1em] text-muted">What happened afterward</h3>
                        {order.legs?.map((leg) => {
                          const pos = positions.find((p) => p.symbol === leg.symbol);
                          const pl = pos ? parseFloat(pos.unrealized_pl) : null;
                          return (
                            <p key={leg.symbol} className="mt-1 font-mono text-sm">
                              {leg.symbol}: {pl === null ? "No longer an open position" : `${pl >= 0 ? "+" : ""}$${pl.toFixed(2)} unrealized`}
                            </p>
                          );
                        })}
                        <p className="mt-2 text-xs text-muted">Expected max profit ${entry.maxProfit.toFixed(2)}, max loss ${entry.maxLoss.toFixed(2)}, breakeven ${entry.breakeven.toFixed(2)}.</p>
                      </>
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
