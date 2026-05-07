const currencySymbolMap: Record<string, string> = {
  CNY: "¥",
  USD: "$",
  EUR: "€",
  JPY: "¥",
};

export function formatMoney(cents: number, currency = "CNY") {
  const symbol = currencySymbolMap[currency] ?? `${currency} `;
  const value = cents / 100;

  return `${symbol}${value.toLocaleString("zh-CN", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function parseAmountToCents(input: string) {
  const normalized = input.trim().replace(/,/g, "");
  if (!normalized) return null;

  const match = normalized.match(/(?:¥|￥)?\s*(\d+(?:\.\d{1,2})?)/);
  if (!match) return null;

  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  return Math.round(amount * 100);
}

export function stripAmountFromText(input: string) {
  return input
    .replace(/(?:¥|￥)?\s*\d+(?:\.\d{1,2})?\s*$/, "")
    .trim();
}
