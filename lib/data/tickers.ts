export const TICKER_POOL = [
  "AAPL", "AMZN", "MSFT", "NVDA", "TSLA", "META", "GOOGL", "AMD",
  "NFLX", "SPY", "QQQ", "JPM", "COIN", "PLTR", "AVGO", "COST", "DIS", "GLD",
];

export function pickRandomTickers(count: number): string[] {
  const shuffled = [...TICKER_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
