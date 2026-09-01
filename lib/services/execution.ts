import { alpacaFetch } from "@/lib/alpaca/client";

export async function placeSpreadOrder(params: {
  longLeg: { symbol: string };
  shortLeg: { symbol: string };
  netDebitPerShare: number;
}) {
  return alpacaFetch("/v2/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      order_class: "mleg",
      qty: "1",
      type: "limit",
      limit_price: params.netDebitPerShare.toFixed(2),
      time_in_force: "day",
      legs: [
        { symbol: params.longLeg.symbol, ratio_qty: "1", side: "buy", position_intent: "buy_to_open" },
        { symbol: params.shortLeg.symbol, ratio_qty: "1", side: "sell", position_intent: "sell_to_open" },
      ],
    }),
  });
}
