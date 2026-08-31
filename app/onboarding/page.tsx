"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getStoredRiskBoundary,
  setStoredRiskBoundary,
  type RiskBoundary,
} from "@/lib/storage/preferences";

const RISK_OPTIONS: { id: RiskBoundary; label: string; detail: string }[] = [
  { id: "conservative", label: "Conservative", detail: "Max 1% of account equity per trade" },
  { id: "balanced", label: "Balanced", detail: "Max 2% of account equity per trade" },
  { id: "aggressive", label: "Aggressive", detail: "Max 5% of account equity per trade" },
];

function playConfirmTone() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.32);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.34);
    osc.onended = () => ctx.close();
  } catch {
    // Sound is a nicety, never block progress on it.
  }
}

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [riskBoundary, setRiskBoundary] = useState<RiskBoundary>("balanced");
  const [connectionStatus, setConnectionStatus] =
    useState<"checking" | "connected" | "unavailable">("checking");
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    setRiskBoundary(getStoredRiskBoundary());
  }, []);

  useEffect(() => {
    if (step !== 0) return;
    let cancelled = false;
    fetch("/api/test-alpaca")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setConnectionStatus(data.connected ? "connected" : "unavailable");
      })
      .catch(() => {
        if (!cancelled) setConnectionStatus("unavailable");
      });
    return () => {
      cancelled = true;
    };
  }, [step]);

  function selectRiskBoundary(id: RiskBoundary) {
    setRiskBoundary(id);
    setStoredRiskBoundary(id);
  }

  function goNext(final: boolean) {
    if (!reducedMotion) playConfirmTone();
    if (final) {
      router.push("/overview");
      return;
    }
    if (reducedMotion) {
      setStep((s) => s + 1);
      return;
    }
    setLeaving(true);
    setTimeout(() => {
      setStep((s) => s + 1);
      setLeaving(false);
    }, 300);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16 sm:px-10">
      <div
        className="w-full max-w-md transition-all duration-300"
        style={{
          transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
          opacity: leaving ? 0 : 1,
          transform: leaving ? "translateY(-8px)" : "translateY(0)",
        }}
      >
        <p className="font-mono text-xs uppercase tracking-[0.15em] text-accent">
          Step {String(step + 1).padStart(2, "0")} of 04
        </p>

        {step === 0 && (
          <>
            <h1 className="mt-4 text-balance text-3xl font-medium leading-tight tracking-tight">
              Let&apos;s establish your trading environment.
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              {connectionStatus === "checking" && "Checking Alpaca connection..."}
              {connectionStatus === "connected" && "Connected. Paper trading account active."}
              {connectionStatus === "unavailable" && "Alpaca connection required."}
            </p>
          </>
        )}

        {step === 1 && (
          <>
            <h1 className="mt-4 text-balance text-3xl font-medium leading-tight tracking-tight">
              Paper trading only.
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Every trade KRYPTA proposes executes in Alpaca&apos;s paper environment. No real funds are ever placed at risk here.
            </p>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="mt-4 text-balance text-3xl font-medium leading-tight tracking-tight">
              Set your risk boundary.
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              The Risk Gate will use this to check every proposed trade. You can change it later.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              {RISK_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => selectRiskBoundary(option.id)}
                  className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                    riskBoundary === option.id
                      ? "border-accent bg-surface"
                      : "border-border hover:border-muted"
                  }`}
                >
                  <p className="text-sm font-medium">{option.label}</p>
                  <p className="mt-0.5 text-xs text-muted">{option.detail}</p>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="mt-4 text-balance text-3xl font-medium leading-tight tracking-tight">
              Your workspace is ready.
            </h1>
            <ul className="mt-4 space-y-1.5 text-sm text-muted">
              <li>Environment: Paper trading</li>
              <li>Risk boundary: {RISK_OPTIONS.find((o) => o.id === riskBoundary)?.label}</li>
            </ul>
          </>
        )}

        <button
          type="button"
          onClick={() => goNext(step === 3)}
          className="mt-10 inline-flex w-full items-center justify-center rounded-full bg-accent px-8 py-3.5 text-sm font-medium text-background transition-transform duration-150 ease-out hover:brightness-110 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {step === 3 ? "Enter workspace" : "Continue"}
        </button>
      </div>
    </main>
  );
}
