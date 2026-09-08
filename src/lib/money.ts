const SYMBOLS: Record<string, string> = {
  BDT: "\u09F3",
  USD: "$",
  EUR: "\u20AC",
  GBP: "\u00A3",
  INR: "\u20B9",
  PKR: "\u20A8",
  AED: "\u062F.\u0625",
  SAR: "\uFDFC",
  MYR: "RM",
  JPY: "\u00A5",
};

export const CURRENCIES = Object.keys(SYMBOLS);

export function currencySymbol(currency = "BDT") {
  return SYMBOLS[currency] ?? currency;
}

export function formatMoney(amount: number, currency = "BDT") {
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));

  const sign = amount < 0 ? "-" : "";
  return `${sign}${currencySymbol(currency)}${formatted}`;
}

/**
 * Compact form for chart axes: 12.5k, 1.2M — deliberately without a currency
 * symbol. The axis repeats it on every tick for no information gain, and not
 * every font ships a glyph for it (the taka sign in particular), so tooltips
 * and totals carry the symbol instead.
 */
export function formatCompact(amount: number) {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";

  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(1)}k`;
  return `${sign}${abs}`;
}
