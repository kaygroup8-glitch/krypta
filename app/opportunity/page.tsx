"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getStoredRiskBoundary } from "@/lib/storage/preferences";
import { setReviewedOpportunity } from "@/lib/storage/session";

interface OpportunityResult {
  insufficientData?: boolean;
  message?: string;
  symbol?: string;
  spotPrice?: number;
  expiration?: string;
  spread?: {
    longLeg: { symbol: string; strike: number };
    shortLeg: { symbol: string; strike: number };
    netDebitPerShare: number;
    netDebitTotal: number;
    maxProfit: number;
    maxLoss: number;
    breakeven: number;
  };
  thesis?: { thesis: string; supportedBy: string[] };
  critique?: { hasConcerns: boolean; concerns: string[] };
  riskGate?: { passed: boolean; checks: { name: string; passed: boolean; detail: string }[] };
  decision?: "EXECUTE" | "WAIT" | "REJECT";
}

const DECISION_STYLE: Record<string, string> = {
  EXECUTE: "border-confirm text-confirm",
  WAIT: "border-accent text-accent",
  REJECT: "border-risk text-risk",
};

function OpportunityContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const symbol = searchParams.get("symbol") ?? "SPY";
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<OpportunityResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const riskBoundary = getStoredRiskBoundary();
    setLoading(true);
    setError(null);
    fetch(`/api/opportunity?symbol=${encodeURIComponent(symbol)}&riskBoundary=${riskBoundary}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.connected) setResult(data);
        else setError(data.error ?? "Alpaca connection required.");
      })
      .catch(() => setError("Alpaca connection required."))
      .finally(() => setLoading(false));
  }, [symbol]);

  function approve() {
    if (!result) return;
    setReviewedOpportunity(result);
    router.push("/approval");
  }

  return (
    <main className="flex min-h-screen flex-col items-center px-6 py-16">
      <div className="container-fluid">
        <Link href="/overview" data-mounted={mounted} className="reveal-fade text-sm text-muted transition-colors hover:text-foreground">← Overview</Link>

        <h1 data-mounted={mounted} style={{ animationDelay: "75ms" }} className="reveal text-fluid-h1 mt-8 font-medium tracking-tight">{symbol}</h1>

        {loading && <p data-mounted={mounted} className="reveal mt-4 text-sm text-muted">Observing verified market data...</p>}
        {!loading && error && <p data-mounted={mounted} className="reveal mt-4 text-sm text-muted">{error}</p>}
        {!loading && result?.insufficientData && (
          <p data-mounted={mounted} className="reveal mt-4 text-sm text-muted">{result.message ?? "Nothing meets the current evidence threshold."}</p>
        )}

        {!loading && result && !result.insufficientData && result.spread && result.thesis && result.critique && result.riskGate && (
          <>
            <p data-mounted={mounted} style={{ animationDelay: "150ms" }} className="reveal mt-2 font-mono text-sm text-muted">
              Spot ${result.spotPrice?.toFixed(2)} · expiring {result.expiration}
            </p>

            <section data-mounted={mounted} style={{ animationDelay: "225ms" }} className="reveal mt-8 rounded-2xl border border-border bg-surface p-6">
              <h2 className="font-mono text-xs uppercase tracking-[0.15em] text-accent">Thesis</h2>
              <p className="mt-3 text-sm leading-relaxed">{result.thesis.thesis}</p>
              <h3 className="mt-4 text-xs uppercase tracking-[0.1em] text-muted">Evidence</h3>
              <ul className="mt-2 space-y-1.5 text-sm text-muted">{result.thesis.supportedBy.map((p, i) => <li key={i}>{p}</li>)}</ul>
            </section>

            <section data-mounted={mounted} style={{ animationDelay: "300ms" }} className="reveal mt-4 rounded-2xl border border-border bg-surface p-6">
              <h2 className="font-mono text-xs uppercase tracking-[0.15em] text-accent">Risk Critic</h2>
              {result.critique.hasConcerns ? (
                <ul className="mt-3 space-y-1.5 text-sm text-muted">{result.critique.concerns.map((c, i) => <li key={i}>{c}</li>)}</ul>
              ) : (
                <p className="mt-3 text-sm text-muted">No concerns raised against the verified data provided.</p>
              )}
            </section>

            <section data-mounted={mounted} style={{ animationDelay: "375ms" }} className="reveal mt-4 rounded-2xl border border-border bg-surface p-6">
              <h2 className="font-mono text-xs uppercase tracking-[0.15em] text-accent">Strategy</h2>
              <p className="mt-3 text-sm text-muted">Bull call debit spread, long {result.spread.longLeg.strike}, short {result.spread.shortLeg.strike}</p>
              <dl className="mt-3 space-y-2 font-mono text-sm">
                <div className="flex items-center justify-between"><dt className="text-muted">Net debit</dt><dd>${result.spread.netDebitTotal.toFixed(2)}</dd></div>
                <div className="flex items-center justify-between"><dt className="text-muted">Max profit</dt><dd>${result.spread.maxProfit.toFixed(2)}</dd></div>
                <div className="flex items-center justify-between"><dt className="text-muted">Max loss</dt><dd>${result.spread.maxLoss.toFixed(2)}</dd></div>
                <div className="flex items-center justify-between"><dt className="text-muted">Breakeven</dt><dd>${result.spread.breakeven.toFixed(2)}</dd></div>
              </dl>
            </section>

            <section data-mounted={mounted} style={{ animationDelay: "450ms" }} className="reveal mt-4 rounded-2xl border border-border bg-surface p-6">
              <h2 className="font-mono text-xs uppercase tracking-[0.15em] text-accent">Risk Gate</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {result.riskGate.checks.map((check) => (
                  <li key={check.name} className="flex items-start gap-2">
                    <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${check.passed ? "bg-confirm" : "bg-risk"}`} aria-hidden="true" />
                    <span><span className="text-foreground">{check.name}</span><span className="block text-xs text-muted">{check.detail}</span></span>
                  </li>
                ))}
              </ul>
            </section>

            {result.decision && (
              <>
                <div data-mounted={mounted} style={{ animationDelay: "525ms" }} className={`reveal mt-6 inline-flex rounded-full border px-6 py-3 font-mono text-sm uppercase tracking-[0.15em] ${DECISION_STYLE[result.decision]}`}>
                  {result.decision}
                </div>
                {result.decision === "EXECUTE" && (
                  <button
                    type="button"
                    onClick={approve}
                    className="mt-4 flex w-full items-center justify-center rounded-full bg-accent px-8 py-3.5 text-sm font-medium text-background transition-transform duration-150 ease-out hover:brightness-110 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:w-auto"
                  >
                    Approve & continue
                  </button>
                )}
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default function Opportunity() {
  return (
    <Suspense fallback={null}>
      <OpportunityContent />
    </Suspense>
  );
}
