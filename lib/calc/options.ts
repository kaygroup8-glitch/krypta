export interface ParsedOptionSymbol {
  root: string;
  expiration: string;
  type: "call" | "put";
  strike: number;
}

export function parseOptionSymbol(symbol: string): ParsedOptionSymbol {
  const match = symbol.match(/^([A-Z]+)(\d{6})([CP])(\d{8})$/);
  if (!match) {
    throw new Error(`Unrecognized option symbol format: ${symbol}`);
  }
  const [, root, dateStr, typeChar, strikeStr] = match;
  const year = 2000 + parseInt(dateStr.slice(0, 2), 10);
  const month = dateStr.slice(2, 4);
  const day = dateStr.slice(4, 6);
  const type = typeChar === "C" ? "call" : "put";
  const strike = parseInt(strikeStr, 10) / 1000;
  return { root, expiration: `${year}-${month}-${day}`, type, strike };
}

export interface DebitSpreadLeg {
  symbol: string;
  strike: number;
  askPrice: number;
  bidPrice: number;
}

export function calculateBullCallDebitSpread(longLeg: DebitSpreadLeg, shortLeg: DebitSpreadLeg) {
  if (shortLeg.strike <= longLeg.strike) {
    throw new Error("Short leg strike must be higher than long leg strike.");
  }
  if (longLeg.bidPrice > longLeg.askPrice || shortLeg.bidPrice > shortLeg.askPrice) {
    throw new Error("Insufficient verified data: crossed bid/ask quote.");
  }

  const strikeWidth = shortLeg.strike - longLeg.strike;
  const netDebitPerShare = longLeg.askPrice - shortLeg.bidPrice;
  const netDebitTotal = netDebitPerShare * 100;
  const maxProfit = strikeWidth * 100 - netDebitTotal;

  if (netDebitTotal <= 0 || maxProfit < 0) {
    throw new Error("Insufficient verified data: quotes produce a non-viable spread.");
  }

  return {
    longLeg,
    shortLeg,
    netDebitPerShare,
    netDebitTotal,
    maxLoss: netDebitTotal,
    maxProfit,
    breakeven: longLeg.strike + netDebitPerShare,
    strikeWidth,
  };
}

export const LIQUIDITY_SPREAD_THRESHOLD_PERCENT = 8;

export function calculateQuoteSpreadPercent(leg: DebitSpreadLeg): number {
  const mid = (leg.askPrice + leg.bidPrice) / 2;
  if (mid <= 0) return 0;
  return ((leg.askPrice - leg.bidPrice) / mid) * 100;
}

export function describeLiquidity(leg: DebitSpreadLeg): string {
  const spreadPercent = calculateQuoteSpreadPercent(leg);
  const flag = spreadPercent > LIQUIDITY_SPREAD_THRESHOLD_PERCENT ? "elevated" : "normal";
  return `${spreadPercent.toFixed(1)}% (${flag}, threshold ${LIQUIDITY_SPREAD_THRESHOLD_PERCENT}%)`;
}
