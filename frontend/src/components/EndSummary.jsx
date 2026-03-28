import { useMemo } from "react";
import { format2 } from "../utils/numberFormat";
import { calculateFullJobSummary } from "../utils/job_calc";


export default function EndSummary({
  expenses = [],
  sales = [],
  fxRates,
  workerNameMap = {},      // { workerId: "Name", ... }
}) {
  const summary = useMemo(() => {
    return calculateFullJobSummary({ expenses, sales }, fxRates);
  }, [expenses, sales, fxRates]);

  const {
    profitAED,
    profitUSD,
    singleWorkerId,
    workerProfitBaseAED,
    workerModalProfitAED,
    coworkerMap,
    coworkerModalProfitMap,
    rateAEDUSD,
  } = summary;

  const hasTotals = Math.abs(profitAED) > 0.01;

  const coworkerItems = Array.from(coworkerMap.entries())
    .map(([id, val]) => {
      const usd = rateAEDUSD ? val / rateAEDUSD : null;
      const usdPart = usd != null ? ` == ${format2(usd)} $` : "";
      const profit = coworkerModalProfitMap.get(id);
      return (
        <span key={id} style={{ display: "block" }}>
          {workerNameMap[id] ?? id} {format2(val)} AED{usdPart}
          {profit != null && profit !== 0
            ? <span className="sum-profit-highlight"> | Profit: {format2(profit)} AED{rateAEDUSD ? ` == ${format2(profit / rateAEDUSD)} $` : ""}</span>
            : null}
        </span>
      );
    });

  return (
    <div className="end-summary">
      
      <div className="sum-row">
        <span className="sum-label">Total profit in AED:</span>
        <div className="sum-values">
            {hasTotals && <span>{format2(profitAED)} AED</span>}
        </div>

        <div className="sum-right">
            <div className="sum-right-item">
                <span className="sum-label">Total profit in USD:</span>
                <div className="sum-values">
                    {hasTotals && Number(fxRates?.AED_to_USD) ? <span>{format2(profitUSD)} $</span> : null}
                </div>
            </div>
        </div>
      </div>


      <div className="sum-row">
        <span className="sum-label">
          Worker {singleWorkerId ? (workerNameMap[singleWorkerId] ?? singleWorkerId) : ""} profit base:
        </span>
        <span className="sum-value">
          {workerProfitBaseAED != null ? `${format2(workerProfitBaseAED)} AED` : ""}
          {workerModalProfitAED != null && workerModalProfitAED !== 0
            ? <span className="sum-profit-highlight"> | Profit: {format2(workerModalProfitAED)} AED</span>
            : null}
        </span>

        <div className="sum-right">
            <div className="sum-right-item">
                <span className="sum-label">Worker's profit base in USD: </span>
                <span className="sum-value">
                {workerProfitBaseAED != null && rateAEDUSD
                ? `${format2(workerProfitBaseAED / rateAEDUSD)}$` : ""}
                {workerModalProfitAED != null && workerModalProfitAED !== 0 && rateAEDUSD
                  ? <span className="sum-profit-highlight"> | Profit: {format2(workerModalProfitAED / rateAEDUSD)} $</span>
                  : null}
                </span>
            </div>
        </div>
      </div>


      <div className="sum-row" style={{ marginTop: "24px" }}>
        <span className="sum-label">Coworker profit base:</span>
        <div style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1 }}>{coworkerItems}</div>
      </div>
    </div>
  );
}
