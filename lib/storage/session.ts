const REVIEWED_OPPORTUNITY_KEY = "krypta:reviewed-opportunity";

export function setReviewedOpportunity(data: unknown): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(REVIEWED_OPPORTUNITY_KEY, JSON.stringify(data));
}

export function getReviewedOpportunity<T>(): T | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(REVIEWED_OPPORTUNITY_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
