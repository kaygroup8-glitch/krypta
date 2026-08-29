function calculateBullCallDebitSpread(longLeg, shortLeg) {
  if (shortLeg.strike <= longLeg.strike) throw new Error("Short leg strike must be higher than long leg strike.");
  if (longLeg.bidPrice > longLeg.askPrice || shortLeg.bidPrice > shortLeg.askPrice) throw new Error("Insufficient verified data: crossed bid/ask quote.");
  const strikeWidth = shortLeg.strike - longLeg.strike;
  const netDebitPerShare = longLeg.askPrice - shortLeg.bidPrice;
  const netDebitTotal = netDebitPerShare * 100;
  const maxProfit = strikeWidth * 100 - netDebitTotal;
  if (netDebitTotal <= 0 || maxProfit < 0) throw new Error("Insufficient verified data: quotes produce a non-viable spread.");
  return { netDebitPerShare, netDebitTotal, maxLoss: netDebitTotal, maxProfit, breakeven: longLeg.strike + netDebitPerShare, strikeWidth };
}

console.log("Sane case:", calculateBullCallDebitSpread(
  { strike: 765, askPrice: 12.5, bidPrice: 12.2 },
  { strike: 770, askPrice: 9.8, bidPrice: 9.5 }
));

try {
  calculateBullCallDebitSpread(
    { strike: 420, askPrice: 349.02, bidPrice: 357.56 },
    { strike: 425, askPrice: 18.03, bidPrice: 19.53 }
  );
} catch (e) {
  console.log("Bad data case correctly rejected:", e.message);
}
