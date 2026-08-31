export type RiskBoundary = "conservative" | "balanced" | "aggressive";

const RISK_BOUNDARY_KEY = "krypta:risk-boundary";
const DEFAULT_RISK_BOUNDARY: RiskBoundary = "balanced";

export function getStoredRiskBoundary(): RiskBoundary {
  if (typeof window === "undefined") return DEFAULT_RISK_BOUNDARY;
  const stored = window.localStorage.getItem(RISK_BOUNDARY_KEY);
  if (stored === "conservative" || stored === "balanced" || stored === "aggressive") {
    return stored;
  }
  return DEFAULT_RISK_BOUNDARY;
}

export function setStoredRiskBoundary(value: RiskBoundary): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(RISK_BOUNDARY_KEY, value);
}
