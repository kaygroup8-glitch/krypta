"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getStoredRiskBoundary } from "@/lib/storage/preferences";
import { setReviewedOpportunity } from "@/lib/storage/session";
import { playConfirmTone } from "@/lib/sound/confirm";

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
  critique?: { hasConcerns: boolean; concerns: string[]; dataLimitations: string[] };
  riskGate?: { passed: boolean; checks: { name: string; passed: boolean; detail: string }[] };
  decision?: "EXECUTE" | "WAIT" | "REJECT";
}

const STAGES = ["observe", "evidence", "thesis", "challenge", "strategy", "riskgate", "summary", "decision"] as const;
type Stage = typeof STAGES[number];

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
  const [reducedMotion, setReducedMotion] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    setMounted(true);
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
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

  function advance() {
    if (!reducedMotion) playConfirmTone();
    if (reducedMotion) {
      setStageIndex((i) => i + 1);
      return;
    }
    setLeaving(true);
    setTimeout(() => {
      setStageIndex((i) => i + 1);
      setLeaving(false);
    }, 250);
  }

  function approve() {
    if (!result) return;
    setReviewedOpportunity(result);
    router.push("/approval");
  }

  const stage: Stage | undefined = STAGES[stageIndex];
  const ready = Boolean(!loading && result && !result.insufficientData && result.spread && result.thesis && result.critique && result.riskGate);

  return (
    <main className="flex min-h-screen flex-col px-6 py-10">
      <div className="container-fluid flex items-center justify-between">
        <Link href="/overview" data-mounted={mounted} className="reveal-fade text-sm text-muted transition-colors hover:text-foreground">← Overview</Link>
        {ready && <span data-mounted={mounted} className="reveal-fade font-mono text-xs text-muted">{symbol} · ${result!.spotPrice?.toFixed(2)}</span>}
      </div>

      <div className="flex flex-1 items-center justify-center py-10">
        {loading && <p className="text-sm text-muted">Observing verified market data...</p>}
        {!loading && error && <p className="text-sm text-muted">{error}</p>}
        {!loading && result?.insufficientData && <p className="text-sm text-muted">{result.message ?? "Nothing meets the current evidence threshold."}</p>}

        {ready && (
          <div
            className="w-full max-w-md transition-all duration-250"
            style={{
              transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
              opacity: leaving ? 0 : 1,
              transform: leaving ? "translateY(-8px)" : "translateY(0)",
            }}
          >
            {stage === "observe" && (
              <section className="rounded-2xl border border-border bg-surface p-6">
                <h2 className="font-mono text-xs uppercase tracking-[0.15em] text-accent">Observe</h2>
                <p className="mt-1 text-xs text-muted">What is happening.</p>
                <p className="mt-4 font-mono text-lg">${result!.spotPrice?.toFixed(2)}</p>
                <p className="mt-1 text-sm text-muted">{symbol}, options chain expiring {result!.expiration}.</p>
              </section>
            )}
            {stage === "evidence" && (
              <section className="rounded-2xl border border-border bg-surface p-6">
                <h2 className="font-mono text-xs uppercase tracking-[0.15em] text-accent">Evidence</h2>
                <p className="mt-1 text-xs text-muted">What do we actually know.</p>
                <ul className="mt-4 space-y-1.5 text-sm text-muted">{result!.thesis!.supportedBy.map((p, i) => <li key={i}>{p}</li>)}</ul>
              </section>
            )}
            {stage === "thesis" && (
              <section className="rounded-2xl border border-border bg-surface p-6">
                <h2 className="font-mono text-xs uppercase tracking-[0.15em] text-accent">Thesis</h2>
                <p className="mt-1 text-xs text-muted">What could be happening.</p>
                <p className="mt-4 text-sm leading-relaxed">{result!.thesis!.thesis}</p>
              </section>
            )}
            {stage === "challenge" && (
              <section className="rounded-2xl border border-border bg-surface p-6">
                <h2 className="font-mono text-xs uppercase tracking-[0.15em] text-accent">Challenge</h2>
                <p className="mt-1 text-xs text-muted">Why this could be wrong.</p>
                {result!.critique!.hasConcerns ? (
                  <ul className="mt-4 space-y-1.5 text-sm text-muted">{result!.critique!.concerns.map((c, i) => <li key={i}>{c}</li>)}</ul>
                ) : (
                  <p className="mt-4 text-sm text-muted">No specific concerns raised against this trade.</p>
                )}
                {result!.critique!.dataLimitations.length > 0 && (
                  <>
                    <h3 className="mt-4 text-xs uppercase tracking-[0.1em] text-muted">Known data limits</h3>
                    <ul className="mt-1.5 space-y-1 text-xs text-muted">{result!.critique!.dataLimitations.map((d, i) => <li key={i}>{d}</li>)}</ul>
                  </>
                )}
              </section>
            )}
            {stage === "strategy" && (
              <section className="rounded-2xl border border-border bg-surface p-6">
                <h2 className="font-mono text-xs uppercase tracking-[0.15em] text-accent">Strategy</h2>
                <p className="mt-1 text-xs text-muted">How the thesis is expressed.</p>
                <p className="mt-4 text-sm text-muted">Bull call debit spread, long {result!.spread!.longLeg.strike}, short {result!.spread!.shortLeg.strike}</p>
                <dl className="mt-3 space-y-2 font-mono text-sm">
                  <div className="flex items-center justify-between"><dt className="text-muted">Net debit</dt><dd>${result!.spread!.netDebitTotal.toFixed(2)}</dd></div>
                  <div className="flex items-center justify-between"><dt className="text-muted">Max profit</dt><dd>${result!.spread!.maxProfit.toFixed(2)}</dd></div>
                  <div className="flex items-center justify-between"><dt className="text-muted">Max loss</dt><dd>${result!.spread!.maxLoss.toFixed(2)}</dd></div>
                  <div className="flex items-center justify-between"><dt className="text-muted">Breakeven</dt><dd>${result!.spread!.breakeven.toFixed(2)}</dd></div>
                </dl>
              </section>
            )}
            {stage === "riskgate" && (
              <section className="rounded-2xl border border-border bg-surface p-6">
                <h2 className="font-mono text-xs uppercase tracking-[0.15em] text-accent">Risk Gate</h2>
                <p className="mt-1 text-xs text-muted">Whether this trade is allowed to reach you.</p>
                <ul className="mt-4 space-y-2 text-sm">
                  {result!.riskGate!.checks.map((check) => (
                    <li key={check.name} className="flex items-start gap-2">
                      <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${check.passed ? "bg-confirm" : "bg-risk"}`} aria-hidden="true" />
                      <span><span className="text-foreground">{check.name}</span><span className="block text-xs text-muted">{check.detail}</span></span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {stage === "summary" && (
              <section className="rounded-2xl border border-border bg-surface p-6">
                <h2 className="font-mono text-xs uppercase tracking-[0.15em] text-accent">Summary</h2>
                <p className="mt-1 text-xs text-muted">Everything above, in one glance.</p>
                <p className="mt-4 text-sm leading-relaxed">{result!.thesis!.thesis}</p>
                <dl className="mt-4 space-y-2 font-mono text-sm">
                  <div className="flex items-center justify-between"><dt className="text-muted">Max profit</dt><dd>${result!.spread!.maxProfit.toFixed(2)}</dd></div>
                  <div className="flex items-center justify-between"><dt className="text-muted">Max loss</dt><dd>${result!.spread!.maxLoss.toFixed(2)}</dd></div>
                  <div className="flex items-center justify-between"><dt className="text-muted">Concerns raised</dt><dd>{result!.critique!.concerns.length}</dd></div>
                  <div className="flex items-center justify-between"><dt className="text-muted">Risk Gate</dt><dd>{result!.riskGate!.passed ? "Passed" : "Failed"}</dd></div>
                </dl>
              </section>
            )}
            {stage === "decision" && result!.decision && (
              <section className="rounded-2xl border border-border bg-surface p-6 text-center">
                <h2 className="font-mono text-xs uppercase tracking-[0.15em] text-accent">Decision</h2>
                <div className={`mx-auto mt-4 inline-flex rounded-full border px-6 py-3 font-mono text-sm uppercase tracking-[0.15em] ${DECISION_STYLE[result!.decision]}`}>{result!.decision}</div>
                {result!.decision === "EXECUTE" && (
                  <button type="button" onClick={approve} className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-accent px-8 py-3.5 text-sm font-medium text-background transition-transform duration-150 ease-out hover:brightness-110 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                    Approve & continue
                  </button>
                )}
                {result!.decision === "WAIT" && (
                  <>
                    <p className="mt-4 text-left text-sm text-muted">The Risk Gate passed, this is the critic's judgment, not a hard limit. Your call.</p>
                    <button type="button" onClick={approve} className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-accent px-8 py-3.5 text-sm font-medium text-accent transition-colors hover:bg-accent hover:text-background">
                      Trade anyway
                    </button>
                  </>
                )}
              </section>
            )}

            {stage !== "decision" && (
              <button type="button" onClick={advance} className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-accent px-8 py-3.5 text-sm font-medium text-background transition-transform duration-150 ease-out hover:brightness-110 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                Continue
              </button>
            )}
          </div>
        )}
      </div>

      {ready && (
        <div className="container-fluid flex justify-center gap-1.5 pb-2">
          {STAGES.map((s, i) => (
            <span key={s} className={`h-1 w-6 rounded-full ${i <= stageIndex ? "bg-accent" : "bg-border"}`} aria-hidden="true" />
          ))}
        </div>
      )}
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
