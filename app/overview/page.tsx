"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getStoredRiskBoundary, type RiskBoundary } from "@/lib/storage/preferences";

interface AccountData {
  status: string;
  portfolio_value: string;
  buying_power: string;
  options_approved_level: number;
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
  const [riskBoundary, setRiskBoundary] = useState<RiskBoundary>("balanced");
  const [account, setAccount] = useState<AccountData | null>(null);
  const [accountError, setAccountError] = useState(false);

  useEffect(() => {
    setMounted(true);
    setRiskBoundary(getStoredRiskBoundary());
    fetch("/api/account")
      .then((res) => res.json())
      .then((data) => {
        if (data.connected) setAccount(data.account);
        else setAccountError(true);
      })
      .catch(() => setAccountError(true));
  }, []);

  function checkOpportunity(e: React.FormEvent) {
    e.preventDefault();
    if (!symbol.trim()) return;
    router.push(`/opportunity?symbol=${encodeURIComponent(symbol.trim().toUpperCase())}`);
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
            <Link href="/journal" className="text-sm text-muted transition-colors hover:text-foreground">
              Journal
            </Link>
            <span className="rounded-full border border-border px-3 py-1 font-mono text-xs uppercase tracking-[0.1em] text-muted">
              Paper
            </span>
          </div>
        </div>

        <h1 data-mounted={mounted} style={{ animationDelay: "75ms" }} className="reveal text-fluid-h1 mt-8 font-medium tracking-tight">
          Overview
        </h1>

        <section data-mounted={mounted} style={{ animationDelay: "150ms" }} className="reveal mt-8 rounded-2xl border border-border bg-surface p-6">
          <h2 className="font-mono text-xs uppercase tracking-[0.15em] text-accent">Market State</h2>
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
          <h2 className="font-mono text-xs uppercase tracking-[0.15em] text-accent">Risk Status</h2>
          <p className="mt-3 text-sm text-muted">
            Boundary set to <span className="text-foreground">{RISK_LABELS[riskBoundary]}</span>. Every proposed trade is checked against this before it can reach you.
          </p>
        </section>

        <section data-mounted={mounted} style={{ animationDelay: "300ms" }} className="reveal mt-4 rounded-2xl border border-border bg-surface p-6">
          <h2 className="font-mono text-xs uppercase tracking-[0.15em] text-accent">Opportunities</h2>
          <p className="mt-3 text-sm text-muted">Nothing runs in the background yet. Ask KRYPTA to look at a specific underlying.</p>
          <form onSubmit={checkOpportunity} className="mt-4 flex gap-2">
            <input
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="SPY"
              className="flex-1 rounded-xl border border-border bg-background px-4 py-3 font-mono text-sm uppercase text-foreground outline-none focus-visible:border-accent"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-xl bg-accent px-5 py-3 text-sm font-medium text-background transition-transform duration-150 ease-out hover:brightness-110 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Check
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
