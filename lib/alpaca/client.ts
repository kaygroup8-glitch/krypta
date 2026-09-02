const ALPACA_BASE_URL = process.env.ALPACA_BASE_URL;
const ALPACA_API_KEY = process.env.ALPACA_API_KEY;
const ALPACA_SECRET_KEY = process.env.ALPACA_SECRET_KEY;
const MARKET_DATA_BASE_URL = "https://data.alpaca.markets";

function getAlpacaHeaders(): HeadersInit {
  if (!ALPACA_API_KEY || !ALPACA_SECRET_KEY) {
    throw new Error("Alpaca connection required: missing API credentials.");
  }
  return {
    "APCA-API-KEY-ID": ALPACA_API_KEY,
    "APCA-API-SECRET-KEY": ALPACA_SECRET_KEY,
  };
}

async function fetchWithRetry(url: string, init: RequestInit, retries = 2): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (error) {
    console.error(`[alpaca] fetch failed for ${url}`);
    console.error("[alpaca] error:", error);
    if (error instanceof Error && error.cause) {
      console.error("[alpaca] cause:", error.cause);
    }
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return fetchWithRetry(url, init, retries - 1);
    }
    throw error;
  }
}

export async function alpacaFetch(path: string, init?: RequestInit) {
  if (!ALPACA_BASE_URL) {
    throw new Error("Alpaca connection required: missing base URL.");
  }
  const res = await fetchWithRetry(`${ALPACA_BASE_URL}${path}`, {
    ...init,
    headers: { ...getAlpacaHeaders(), ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Alpaca API error (${res.status}): ${body}`);
  }
  return res.json();
}

export async function getAccount() {
  return alpacaFetch("/v2/account");
}

export async function getOptionChain(underlyingSymbol: string) {
  const params = new URLSearchParams({ feed: "indicative", limit: "50" });
  const res = await fetchWithRetry(
    `${MARKET_DATA_BASE_URL}/v1beta1/options/snapshots/${underlyingSymbol}?${params}`,
    { headers: getAlpacaHeaders(), cache: "no-store" }
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Alpaca API error (${res.status}): ${body}`);
  }
  return res.json();
}

export async function getUnderlyingPrice(symbol: string): Promise<number> {
  const res = await fetchWithRetry(`${MARKET_DATA_BASE_URL}/v2/stocks/${symbol}/quotes/latest`, {
    headers: getAlpacaHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Alpaca API error (${res.status}): ${body}`);
  }
  const data = await res.json();
  const { ap, bp } = data.quote ?? {};
  if (ap == null || bp == null) {
    throw new Error("Insufficient verified data: no live quote for underlying.");
  }
  return (ap + bp) / 2;
}

export async function getPositions() {
  return alpacaFetch("/v2/positions");
}

export async function closePosition(symbolOrAssetId: string) {
  return alpacaFetch(`/v2/positions/${symbolOrAssetId}`, { method: "DELETE" });
}

export async function getOrderHistory() {
  return alpacaFetch("/v2/orders?status=all&limit=50&direction=desc&nested=true");
}
