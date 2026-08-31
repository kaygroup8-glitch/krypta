import { calculateQuoteSpreadPercent, type DebitSpreadLeg } from "@/lib/calc/options";

export type RiskBoundary = "conservative" | "balanced" | "aggressive";

export const RISK_BOUNDARY_MAX_LOSS_PERCENT: Record<RiskBoundary, number> = {
  conservative: 1,
  balanced: 2,
  aggressive: 5,
};

export const RISK_GATE_MAX_QUOTE_SPREAD_PERCENT = 20;
export const MIN_REQUIRED_OPTIONS_LEVEL = 3;

export interface RiskCheck {
  name: string;
  passed: boolean;
  detail: string;
}

export interface RiskGateResult {
  passed: boolean;
  checks: RiskCheck[];
}

interface RiskGateAccount {
  status: string;
  trading_blocked: boolean;
  account_blocked: boolean;
  buying_power: string;
  options_approved_level: number;
  portfolio_value: string;
}

interface RiskGateSpread {
  longLeg: DebitSpreadLeg;
  shortLeg: DebitSpreadLeg;
  netDebitTotal: number;
  maxLoss: number;
}

export function evaluateRiskGate(input: {
  account: RiskGateAccount;
  spread: RiskGateSpread;
  riskBoundary: RiskBoundary;
}): RiskGateResult {
  const { account, spread, riskBoundary } = input;
  const checks: RiskCheck[] = [];

  checks.push({
    name: "Paper trading environment",
    passed: true,
    detail: "Execution is restricted to Alpaca's paper API by configuration, not a runtime check.",
  });

  const accountOk = account.status === "ACTIVE" && !account.trading_blocked && !account.account_blocked;
  checks.push({
    name: "Account in good standing",
    passed: accountOk,
    detail: `Status ${account.status}, trading blocked ${account.trading_blocked}, account blocked ${account.account_blocked}.`,
  });

  const levelOk = account.options_approved_level >= MIN_REQUIRED_OPTIONS_LEVEL;
  checks.push({
    name: "Options approval level",
    passed: levelOk,
    detail: `Account is level ${account.options_approved_level}, multi-leg spreads require level ${MIN_REQUIRED_OPTIONS_LEVEL}.`,
  });

  const portfolioValue = parseFloat(account.portfolio_value);
  const maxLossPercent = portfolioValue > 0 ? (spread.maxLoss / portfolioValue) * 100 : Infinity;
  const allowedPercent = RISK_BOUNDARY_MAX_LOSS_PERCENT[riskBoundary];
  const withinBoundary = maxLossPercent <= allowedPercent;
  checks.push({
    name: "Within account risk boundary",
    passed: withinBoundary,
    detail: `Max loss is ${maxLossPercent.toFixed(2)}% of portfolio value, ${riskBoundary} boundary allows ${allowedPercent}%.`,
  });

  const buyingPower = parseFloat(account.buying_power);
  const buyingPowerOk = spread.netDebitTotal <= buyingPower;
  checks.push({
    name: "Sufficient buying power",
    passed: buyingPowerOk,
    detail: `Net debit ${spread.netDebitTotal.toFixed(2)} against buying power ${buyingPower.toFixed(2)}.`,
  });

  const definedRisk = Number.isFinite(spread.maxLoss) && spread.maxLoss > 0;
  checks.push({
    name: "Defined risk",
    passed: definedRisk,
    detail: `Max loss is fixed at ${spread.maxLoss.toFixed(2)}, structurally cannot exceed that.`,
  });

  const worstSpread = Math.max(
    calculateQuoteSpreadPercent(spread.longLeg),
    calculateQuoteSpreadPercent(spread.shortLeg)
  );
  const liquidityOk = worstSpread <= RISK_GATE_MAX_QUOTE_SPREAD_PERCENT;
  checks.push({
    name: "Liquidity within hard limit",
    passed: liquidityOk,
    detail: `Widest leg quote spread is ${worstSpread.toFixed(1)}%, hard limit is ${RISK_GATE_MAX_QUOTE_SPREAD_PERCENT}%.`,
  });

  return { passed: checks.every((c) => c.passed), checks };
}
