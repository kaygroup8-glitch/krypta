"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getJournalEntries, type JournalEntry } from "@/lib/storage/journal";

const DECISION_STYLE: Record<string, string> = {
  EXECUTE: "border-confirm text-confirm",
  WAIT: "border-accent text-accent",
  REJECT: "border-risk text-risk",
};

export default function Journal() {
  const [mounted, setMounted] = useState(false);
  const [entries, setEntries] = useState<JournalEntry[]>([]);

  useEffect(() => {
    setMounted(true);
    setEntries(getJournalEntries());
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center px-6 py-16">
      <div className="container-fluid">
        <Link href="/overview" data-mounted={mounted} className="reveal-fade text-sm text-muted transition-colors hover:text-foreground">
          ← Overview
        </Link>

        <h1 data-mounted={mounted} style={{ animationDelay: "75ms" }} className="reveal text-fluid-h1 mt-8 font-medium tracking-tight">
          Journal
        </h1>
        <p data-mounted={mounted} style={{ animationDelay: "150ms" }} className="reveal mt-4 text-sm text-muted">
          What KRYPTA believed, what the data said, and what actually happened.
        </p>

        {entries.length === 0 && (
          <p data-mounted={mounted} style={{ animationDelay: "225ms" }} className="reveal mt-10 text-sm text-muted">
            Nothing recorded yet. Entries appear here once a trade is approved and submitted.
          </p>
        )}

        <div className="mt-8 flex flex-col gap-4">
          {entries.map((entry, i) => (
            <section
              key={entry.id}
              data-mounted={mounted}
              style={{ animationDelay: `${225 + i * 60}ms` }}
              className="reveal rounded-2xl border border-border bg-surface p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-mono text-sm">{entry.symbol} · {entry.expiration}</p>
                <span className={`rounded-full border px-3 py-1 font-mono text-xs uppercase tracking-[0.1em] ${DECISION_STYLE[entry.decision] ?? "border-border text-muted"}`}>
                  {entry.decision}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted">
                {new Date(entry.timestamp).toLocaleString()}
              </p>

              <p className="mt-4 text-sm leading-relaxed">{entry.thesis}</p>

              <h3 className="mt-4 text-xs uppercase tracking-[0.1em] text-muted">Evidence</h3>
              <ul className="mt-1.5 space-y-1 text-sm text-muted">
                {entry.evidence.map((e, j) => <li key={j}>{e}</li>)}
              </ul>

              {entry.concerns.length > 0 && (
                <>
                  <h3 className="mt-4 text-xs uppercase tracking-[0.1em] text-muted">Concerns</h3>
                  <ul className="mt-1.5 space-y-1 text-sm text-muted">
                    {entry.concerns.map((c, j) => <li key={j}>{c}</li>)}
                  </ul>
                </>
              )}

              <dl className="mt-4 grid grid-cols-3 gap-2 font-mono text-xs">
                <div><dt className="text-muted">Max profit</dt><dd>${entry.maxProfit.toFixed(2)}</dd></div>
                <div><dt className="text-muted">Max loss</dt><dd>${entry.maxLoss.toFixed(2)}</dd></div>
                <div><dt className="text-muted">Breakeven</dt><dd>${entry.breakeven.toFixed(2)}</dd></div>
              </dl>

              <p className="mt-4 text-xs text-muted">
                {entry.executionStatus === "placed"
                  ? `Order placed, ID ${entry.orderId}.`
                  : `Order failed: ${entry.orderError}`}
              </p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
