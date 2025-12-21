import { useMemo } from "react";
import { calcTotals } from "../utils/totalModals";
import { toAED } from "../utils/currency";
import { format4 } from "../utils/numberFormat";


export default function EndSummary({
  expenses = [],
  sales = [],
  fxRates,
  workerNameMap = {},      // { workerId: "Name", ... }
}) {
  // Итоги по разделам
  const expenseTotals = useMemo(
    () => calcTotals(expenses, fxRates, { qtyKey: "quantity", unitKey: "unit_cost", currencyKey: "currency" }),
    [expenses, fxRates]
  );
  const saleTotals = useMemo(
    () => calcTotals(sales, fxRates, { qtyKey: "quantity", unitKey: "unit_price", currencyKey: "currency" }),
    [sales, fxRates]
  );

  const hasTotals =
  (expenseTotals?.sumAED ?? 0) > 0 ||
  (saleTotals?.sumAED ?? 0) > 0;

  const profitAED = saleTotals.sumAED - expenseTotals.sumAED;
  const profitUSD = Number(fxRates?.AED_to_USD) ? profitAED / Number(fxRates.AED_to_USD) : 0;

  // Worker profit base: только если во всём джобе один worker
  const allWorkers = new Set([
    ...expenses.map(e => e?.worker).filter(Boolean),
    ...sales.map(s => s?.worker).filter(Boolean),
  ]);
  const singleWorkerId = allWorkers.size === 1 ? [...allWorkers][0] : null;

  // Coworker profit base
  const coworkerMap = useMemo(() => {
    const map = new Map();
    
    // расходы, связанные с конкретной продажей (binded_sale === index)
    const costAEDForSale = (saleIndex) =>
      expenses.reduce((sum, e) => {
        if ((e?.binded_sale ?? null) !== saleIndex) return sum;
        const quantity = Number(e?.quantity ?? 0);
        const unit = Number(e?.unit_cost ?? 0);
        const amount = Number.isFinite(quantity * unit) ? quantity * unit : 0;
        const cur = e?.currency || "USD";
        return sum + toAED(amount, cur, fxRates);
      }, 0);

    sales.forEach((s, idx) => {
      let coll = s?.collaboration;
      if (coll == null || coll === "") return;
      if (!Array.isArray(coll)) coll = [coll];

      const quantity  = Number(s?.quantity ?? 0);
      const unit = Number(s?.unit_price ?? 0);
      const amount = Number.isFinite(quantity * unit) ? quantity * unit : 0;
      const cur = s?.currency || "USD";
      const saleAED  = toAED(amount, cur, fxRates);
      const costsAED = costAEDForSale(idx);
      const share = (saleAED - costsAED) / 2; // делим пополам

      coll.forEach((cid) => {
        if (!cid) return;
        const key = String(cid);
        map.set(key, (map.get(key) || 0) + share);
      });
    });
  
    return map;
  }, [sales, expenses, fxRates]);

  // сумма профитов всех coworker (AED)
    const coworkerTotal = Array.from(coworkerMap.values())
    .reduce((sum, v) => sum + v, 0);

    // профит воркера = общий профит минус суммарные доли всех coworker
    const workerProfitBase = singleWorkerId
    ? profitAED - coworkerTotal
    : null;


  const AEDtoUSD = Number(fxRates?.AED_to_USD) || null;
  const coworkerLine = Array.from(coworkerMap.entries())
    .map(([id, val]) => {
      const usd = AEDtoUSD ? val / AEDtoUSD : null;
      const usdPart = usd != null ? ` == ${format4(usd)} $` : "";
      return `${(workerNameMap[id] ?? id)} ${format4(val)} AED${usdPart}`;
    }).join("; ");

  return (
    <div className="end-summary">
      
      <div className="sum-row">
        <span className="sum-label">Total profit in AED:</span>
        <div className="sum-values">
            {hasTotals && <span>{format4(profitAED)} AED</span>}
        </div>

        <div className="sum-right">
            <div className="sum-right-item">
                <span className="sum-label">Total profit in USD:</span>
                <div className="sum-values">
                    {hasTotals && Number(fxRates?.AED_to_USD) ? <span>{format4(profitUSD)} $</span> : null}
                </div>
            </div>
        </div>
      </div>


      <div className="sum-row">
        <span className="sum-label">
          Worker {singleWorkerId ? (workerNameMap[singleWorkerId] ?? singleWorkerId) : ""} profit base:
        </span>
        <span className="sum-value">
          {workerProfitBase != null ? `${format4(workerProfitBase)} AED` : ""}
        </span>

        <div className="sum-right">
            <div className="sum-right-item">
                <span className="sum-label">Worker's profit base in USD: </span>
                <span className="sum-value">
                {workerProfitBase != null && Number(fxRates?.AED_to_USD)
                ? `${format4(workerProfitBase / Number(fxRates.AED_to_USD))}$` : ""}
                </span>
            </div>
        </div>
      </div>


      <div className="sum-row">
        <span className="sum-label">Coworker profit base:</span>
        <span className="sum-value">{coworkerLine.replace(/;\s*/g, ';\n')}</span>
      </div>
    </div>
  );
}
