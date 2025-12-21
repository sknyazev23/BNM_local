import { toAED } from "./currency";

export function calcTotals(rows, fx, {
  qtyKey = "quantity",
  unitKey = "unit_cost",
  currencyKey = "currency",
} = {}) {
  let sumAED = 0;

  for (const r of rows) {
    const quantity  = Number(r?.[qtyKey] ?? 0);
    const unit = Number(r?.[unitKey] ?? 0);
    const amount = Number.isFinite(quantity * unit) ? quantity * unit : 0;
    const aed = toAED(amount, r?.[currencyKey] || "USD", fx);
    if (Number.isFinite(aed)) sumAED += aed;
  }

  const rate = Number(fx?.AED_to_USD) || 0;
  const sumUSD = rate ? (sumAED / rate) : 0;

  return { sumAED, sumUSD };
}
