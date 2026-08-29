const ALPACA_BASE_URL = process.env.ALPACA_BASE_URL;
const ALPACA_API_KEY = process.env.ALPACA_API_KEY;
const ALPACA_SECRET_KEY = process.env.ALPACA_SECRET_KEY;

function getAlpacaHeaders(): HeadersInit {
  if (!ALPACA_API_KEY || !ALPACA_SECRET_KEY) {
    throw new Error("Alpaca connection required: missing API credentials.");
  }
  return {
    "APCA-API-KEY-ID": ALPACA_API_KEY,
    "APCA-API-SECRET-KEY": ALPACA_SECRET_KEY,
  };
}

export async function alpacaFetch(path: string, init?: RequestInit) {
  if (!ALPACA_BASE_URL) {
    throw new Error("Alpaca connection required: missing base URL.");
  }
  const res = await fetch(`${ALPACA_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...getAlpacaHeaders(),
      ...(init?.headers ?? {}),
    },
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

const MARKET_DATA_BASE_URL = "https://data.alpaca.markets";

export async function getOptionChain(underlyingSymbol: string) {
  const params = new URLSearchParams({
    feed: "indicative",
    limit: "50",
  });
  const res = await fetch(
    `${MARKET_DATA_BASE_URL}/v1beta1/options/snapshots/${underlyingSymbol}?${params}`,
    {
      headers: getAlpacaHeaders(),
      cache: "no-store",
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Alpaca API error (${res.status}): ${body}`);
  }

  return res.json();
}

export async function getUnderlyingPrice(symbol: string): Promise<number> {
  const res = await fetch(`https://data.alpaca.markets/v2/stocks/${symbol}/quotes/latest`, {
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
