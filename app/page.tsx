"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const PROOF_CHAIN = [
  { label: "Observe", detail: "Verified market and options data only" },
  { label: "Evidence", detail: "What actually supports the thesis" },
  { label: "Thesis", detail: "A structured, falsifiable hypothesis" },
  { label: "Challenge", detail: "The Risk Critic attacks its own case" },
  { label: "Structure", detail: "A defined-risk strategy, calculated deterministically" },
  { label: "Risk Gate", detail: "Hard constraints checked before anything reaches you" },
];

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-20">
      <div className="container-fluid">
        <div data-mounted={mounted} className="reveal-fade flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
          <span className="text-sm font-medium tracking-[0.2em] text-muted uppercase">
            Krypta
          </span>
        </div>

        <h1
          data-mounted={mounted}
          style={{ animationDelay: "75ms" }}
          className="reveal text-fluid-hero mt-8 text-balance font-medium leading-[1.1] tracking-tight"
        >
          Prove the trade before you place it.
        </h1>

        <p
          data-mounted={mounted}
          style={{ animationDelay: "150ms" }}
          className="reveal text-fluid-body mt-6 max-w-2xl text-balance leading-relaxed text-muted"
        >
          An evidence-first AI options agent that researches, challenges, and validates a trade before paper execution.
        </p>

        <div className="mt-14 flex flex-col gap-4 sm:flex-row sm:items-center">
          <Link
            href="/consent"
            data-mounted={mounted}
            style={{ animationDelay: "300ms" }}
            className="reveal inline-flex items-center justify-center rounded-full bg-accent px-8 py-3.5 text-sm font-medium text-background transition-transform duration-150 ease-out hover:brightness-110 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Enter KRYPTA
          </Link>
          <a
            href="#how-it-works"
            data-mounted={mounted}
            style={{ animationDelay: "300ms" }}
            className="reveal inline-flex items-center justify-center px-2 py-3.5 text-sm font-medium text-muted transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            How it works
          </a>
        </div>

        <p
          data-mounted={mounted}
          style={{ animationDelay: "500ms" }}
          className="reveal-fade mt-4 text-xs text-muted"
        >
          Paper trading only. No real funds at risk.
        </p>
      </div>

      <div id="how-it-works" className="container-fluid mt-28 scroll-mt-10">
        <ol className="relative border-l border-border pl-8">
          {PROOF_CHAIN.map((step, i) => (
            <li
              key={step.label}
              data-mounted={mounted}
              style={{ animationDelay: `${i * 70}ms` }}
              className="reveal relative pb-10 last:pb-0"
            >
              <span
                className="absolute left-[-33px] top-1 h-[7px] w-[7px] rounded-full bg-accent"
                aria-hidden="true"
              />
              <p className="font-mono text-xs uppercase tracking-[0.15em] text-accent">
                {step.label}
              </p>
              <p className="text-fluid-body mt-1.5 text-muted">{step.detail}</p>
            </li>
          ))}
        </ol>
      </div>
    </main>
  );
}
