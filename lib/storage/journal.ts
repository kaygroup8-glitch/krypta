export interface JournalEntry {
  id: string;
  timestamp: string;
  symbol: string;
  expiration: string;
  strategy: string;
  thesis: string;
  evidence: string[];
  concerns: string[];
  riskGateChecks?: { name: string; passed: boolean; detail: string }[];
  maxProfit: number;
  maxLoss: number;
  breakeven: number;
  decision: string;
  executionStatus: "placed" | "failed";
  orderId?: string;
  orderError?: string;
}

const JOURNAL_KEY = "krypta:journal";

export function getJournalEntries(): JournalEntry[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(JOURNAL_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as JournalEntry[];
  } catch {
    return [];
  }
}

export function addJournalEntry(entry: JournalEntry): void {
  if (typeof window === "undefined") return;
  const entries = getJournalEntries();
  entries.unshift(entry);
  window.localStorage.setItem(JOURNAL_KEY, JSON.stringify(entries));
}
