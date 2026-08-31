const RISK_BOUNDARY_MAX_LOSS_PERCENT = { conservative: 1, balanced: 2, aggressive: 5 };

const account = {
  status: "ACTIVE",
  trading_blocked: false,
  account_blocked: false,
  buying_power: "100000",
  options_approved_level: 3,
  portfolio_value: "100000",
};

const spread = {
  longLeg: { strike: 765, askPrice: 12.5, bidPrice: 12.2 },
  shortLeg: { strike: 770, askPrice: 9.8, bidPrice: 9.5 },
  netDebitTotal: 300,
  maxLoss: 300,
};

const maxLossPercent = (spread.maxLoss / parseFloat(account.portfolio_value)) * 100;
console.log("Max loss % of portfolio:", maxLossPercent.toFixed(3));
console.log("Passes conservative (1%)?", maxLossPercent <= RISK_BOUNDARY_MAX_LOSS_PERCENT.conservative);
console.log("Passes balanced (2%)?", maxLossPercent <= RISK_BOUNDARY_MAX_LOSS_PERCENT.balanced);
