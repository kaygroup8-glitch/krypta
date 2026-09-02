"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getReviewedOpportunity } from "@/lib/storage/session";
import { addJournalEntry } from "@/lib/storage/journal";
import { playConfirmTone } from "@/lib/sound/confirm";

interface ReviewedOpportunity {
  symbol: string;
  expiration: string;
  spread: {
    longLeg: { symbol: string; strike: number };
    shortLeg: { symbol: string; strike: number };
    netDebitPerShare: number;
    netDebitTotal: number;
    maxProfit: number;
    maxLoss: number;
    breakeven: number;
  };
  thesis: { thesis: string; supportedBy: string[] };
  critique: { hasConcerns: boolean; concerns: string[]; dataLimitations: string[] };
  riskGate: { passed: boolean; checks: { name: string; passed: boolean; detail: string }[] };
  decision: string;
}

export default function Approval() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<ReviewedOpportunity | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [result, setResult] = useState<{ placed: boolean; order?: any; error?: string } | null>(null);

  useEffect(() => {
    setMounted(true);
    setData(getReviewedOpportunity<ReviewedOpportunity>());
  }, []);

  async function confirmOrder() {
    if (!data) return;
    setSubmitting(true);
    let body: { placed: boolean; order?: any; error?: string };
    try {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          longLeg: data.spread.longLeg,
          shortLeg: data.spread.shortLeg,
          netDebitPerShare: data.spread.netDebitPerShare,
        }),
      });
      body = await res.json();
    } catch (error) {
      body = { placed: false, error: (error as Error).message };
    }
    if (body.placed) playConfirmTone();
    setResult(body);
    addJournalEntry({
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      symbol: data.symbol,
      expiration: data.expiration,
      strategy: `Bull call debit spread, long ${data.spread.longLeg.strike}, short ${data.spread.shortLeg.strike}`,
      thesis: data.thesis.thesis,
      evidence: data.thesis.supportedBy,
      concerns: data.critique.concerns,
      riskGateChecks: data.riskGate.checks,
      maxProfit: data.spread.maxProfit,
      maxLoss: data.spread.maxLoss,
      breakeven: data.spread.breakeven,
      decision: data.decision,
      executionStatus: body.placed ? "placed" : "failed",
      orderId: body.order?.id,
      orderError: body.error,
    });
    setSubmitting(false);
  }

  if (!data) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
        <div className="container-fluid text-center">
          <p className="text-sm text-muted">Nothing to approve. Review an opportunity first.</p>
          <Link href="/overview" className="mt-4 inline-block text-sm text-accent">← Overview</Link>
        </div>
      </main>
    );
  }

  const isOverride = data.decision === "WAIT";
  const canSubmit = isOverride ? acknowledged : true;

  return (
    <main className="flex min-h-screen flex-col items-center px-6 py-16">
      <div className="container-fluid">
        <Link href={`/opportunity?symbol=${data.symbol}`} data-mounted={mounted} className="reveal-fade text-sm text-muted transition-colors hover:text-foreground">← {data.symbol}</Link>

        <h1 data-mounted={mounted} style={{ animationDelay: "75ms" }} className="reveal text-fluid-h1 mt-8 font-medium tracking-tight">
          KRYPTA has a proposal.
        </h1>
        <p data-mounted={mounted} style={{ animationDelay: "150ms" }} className="reveal mt-4 text-sm text-muted">
          The decision is yours. Nothing places until you confirm.
        </p>

        <section data-mounted={mounted} style={{ animationDelay: "225ms" }} className="reveal mt-8 rounded-2xl border border-border bg-surface p-6">
          <h2 className="font-mono text-xs uppercase tracking-[0.15em] text-accent">Order</h2>
          <p className="mt-3 text-sm">Buy {data.spread.longLeg.symbol}, sell {data.spread.shortLeg.symbol}</p>
          <dl className="mt-3 space-y-2 font-mono text-sm">
            <div className="flex items-center justify-between"><dt className="text-muted">Net debit</dt><dd>${data.spread.netDebitTotal.toFixed(2)}</dd></div>
            <div className="flex items-center justify-between"><dt className="text-muted">Max profit</dt><dd>${data.spread.maxProfit.toFixed(2)}</dd></div>
            <div className="flex items-center justify-between"><dt className="text-muted">Max loss</dt><dd>${data.spread.maxLoss.toFixed(2)}</dd></div>
            <div className="flex items-center justify-between"><dt className="text-muted">Breakeven</dt><dd>${data.spread.breakeven.toFixed(2)}</dd></div>
          </dl>
          <p className="mt-4 text-xs text-muted">Limit order, net debit {data.spread.netDebitPerShare.toFixed(2)} per share, day order, paper environment.</p>
        </section>

        {isOverride && (
          <section className="mt-4 rounded-2xl border border-risk/40 bg-surface p-6">
            <h2 className="font-mono text-xs uppercase tracking-[0.15em] text-risk">Proceeding against KRYPTA's recommendation</h2>
            <ul className="mt-3 space-y-1.5 text-sm text-muted">
              {data.critique.concerns.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
            <label className="mt-4 flex cursor-pointer items-start gap-3">
              <input type="checkbox" checked={acknowledged} onChange={(e) => setAcknowledged(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 rounded border-border bg-background accent-risk" />
              <span className="text-sm text-muted">I understand these concerns and want to proceed anyway.</span>
            </label>
          </section>
        )}

        {!result && (
          <button
            type="button"
            disabled={submitting || !canSubmit}
            onClick={confirmOrder}
            className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-accent px-8 py-3.5 text-sm font-medium text-background transition-transform duration-150 ease-out hover:brightness-110 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50 sm:w-auto"
          >
            {submitting ? "Placing paper order..." : "Place paper order"}
          </button>
        )}

        {result && (
          <section className="mt-6 rounded-2xl border border-border bg-surface p-6">
            <h2 className="font-mono text-xs uppercase tracking-[0.15em] text-accent">{result.placed ? "Order placed" : "Order failed"}</h2>
            <p className="mt-3 text-sm text-muted">{result.placed ? `Order ID ${result.order?.id}, status ${result.order?.status}.` : result.error}</p>
            <Link href="/overview" className="mt-4 inline-block text-sm text-accent">← Back to Overview</Link>
          </section>
        )}
      </div>
    </main>
  );
}
