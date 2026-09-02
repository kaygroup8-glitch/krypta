"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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
  filled_avg_price: string | null;
  legs?: OrderLeg[] | null;
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    fetch("/api/trade-history")
      .then((res) => res.json())
      .then((data) => {
        if (data.connected) setOrders(data.orders);
        else setError(data.error ?? "Alpaca connection required.");
      })
      .catch(() => setError("Alpaca connection required."));
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center px-6 py-16">
      <div className="container-fluid">
        <Link href="/overview" data-mounted={mounted} className="reveal-fade text-sm text-muted transition-colors hover:text-foreground">← Overview</Link>
        <h1 data-mounted={mounted} style={{ animationDelay: "75ms" }} className="reveal text-fluid-h1 mt-8 font-medium tracking-tight">Trade History</h1>
        <p data-mounted={mounted} style={{ animationDelay: "150ms" }} className="reveal mt-4 text-sm text-muted">Every order KRYPTA has actually submitted to Alpaca, pulled live.</p>

        {error && <p className="mt-8 text-sm text-muted">{error}</p>}
        {!error && orders === null && <p className="mt-8 text-sm text-muted">Loading order history...</p>}
        {orders && orders.length === 0 && <p className="mt-8 text-sm text-muted">No orders submitted yet.</p>}

        <div className="mt-8 flex flex-col gap-3">
          {orders?.map((order, i) => (
            <section key={order.id} data-mounted={mounted} style={{ animationDelay: `${225 + i * 50}ms` }} className="reveal rounded-2xl border border-border bg-surface p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-mono text-sm">{order.symbol} · {order.order_class}</p>
                <span className={`font-mono text-xs uppercase tracking-[0.1em] ${STATUS_STYLE[order.status] ?? "text-muted"}`}>{order.status}</span>
              </div>
              {order.legs && order.legs.length > 0 && (
                <ul className="mt-2 space-y-1 font-mono text-xs text-muted">
                  {order.legs.map((leg) => <li key={leg.symbol}>{leg.side} {leg.ratio_qty} · {leg.symbol}</li>)}
                </ul>
              )}
              <p className="mt-2 text-xs text-muted">
                Submitted {new Date(order.submitted_at).toLocaleString()}
                {order.filled_at && ` · Filled ${new Date(order.filled_at).toLocaleString()}`}
              </p>
              {order.filled_avg_price && <p className="mt-1 font-mono text-xs">Filled avg price: ${order.filled_avg_price}</p>}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
