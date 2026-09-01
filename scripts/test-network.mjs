try {
  const res = await fetch("https://paper-api.alpaca.markets/v2/account", {
    headers: {
      "APCA-API-KEY-ID": process.env.ALPACA_API_KEY,
      "APCA-API-SECRET-KEY": process.env.ALPACA_SECRET_KEY,
    },
  });
  console.log("Status:", res.status);
  console.log("Body:", await res.text());
} catch (error) {
  console.log("Message:", error.message);
  console.log("Cause:", error.cause);
}
