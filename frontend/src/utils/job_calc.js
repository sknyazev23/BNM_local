import { toAED } from "./currency";
import { calcTotals } from "./totalModals";

/**
 * Calculates all financial metrics for a job, including worker and coworker profit splits.
 * Shared between EndSummary component and Excel export utility.
 */
export function calculateFullJobSummary(job, fxRates) {
  const expenses = job.expenses || [];
  const sales = job.sales || [];
  
  // Use provided fxRates or fallback to job fields
  const fx = fxRates || {
    AED_to_USD: job.rateAEDUSD || "3.6700",
    RUB_to_USD: job.rateRUBUSD || "0",
    AED_to_EUR: job.rateAEDEUR || "0",
  };

  const expenseTotals = calcTotals(expenses, fx, { qtyKey: "quantity", unitKey: "unit_cost", currencyKey: "currency" });
  const saleTotals = calcTotals(sales, fx, { qtyKey: "quantity", unitKey: "unit_price", currencyKey: "currency" });

  const profitAED = saleTotals.sumAED - expenseTotals.sumAED;
  const rateAEDUSD = Number(fx.AED_to_USD) || 3.67;
  const rateRUBUSD = Number(fx.RUB_to_USD) || 0;
  
  const profitUSD = rateAEDUSD ? profitAED / rateAEDUSD : 0;
  const profitRUB = rateRUBUSD ? profitUSD * rateRUBUSD : 0;

  // Identify if there's exactly one worker responsible for the whole job
  const allWorkers = new Set([
    ...expenses.map(e => e?.worker).filter(Boolean),
    ...sales.map(s => s?.worker).filter(Boolean),
  ]);
  const singleWorkerId = allWorkers.size === 1 ? [...allWorkers][0] : null;

  // Coworker profit base calculation (proportional distribution of overheads)
  const coworkerMap = new Map();
  let totalUnboundExpensesAED = 0;
  
  expenses.forEach(e => {
    const b = e?.binded_sale || e?.sale_id || null;
    if (!b) {
      const q = Number(e.quantity || 0);
      const u = Number(e.unit_cost || 0);
      totalUnboundExpensesAED += toAED(q * u, e.currency || "USD", fx);
    }
  });

  const totalSalesAED = saleTotals.sumAED;

  sales.forEach((s, idx) => {
    let coll = s?.collaboration;
    if (!coll) return;
    if (!Array.isArray(coll)) coll = [coll];

    const q = Number(s.quantity || 0);
    const u = Number(s.unit_price || 0);
    const sAED = toAED(q * u, s.currency || "USD", fx);

    // Bound expenses specifically for this sale
    const boundAED = expenses.reduce((sum, e) => {
       const b = e?.binded_sale || e?.sale_id || null;
       const sId = String(s._id || s.id);
       if (b !== sId && String(b) !== String(idx)) return sum;
       return sum + toAED((Number(e.quantity)||0) * (Number(e.unit_cost)||0), e.currency || "USD", fx);
    }, 0);

    const proportion = totalSalesAED > 0 ? (sAED / totalSalesAED) : 0;
    const allocatedUnbound = totalUnboundExpensesAED * proportion;
    const totalCosts = boundAED + allocatedUnbound;
    const share = (sAED - totalCosts) / 2; // Split profit 50/50 with coworker

    coll.forEach(cid => {
      if (!cid) return;
      const key = String(cid);
      coworkerMap.set(key, (coworkerMap.get(key) || 0) + share);
    });
  });

  const coworkerTotalAED = Array.from(coworkerMap.values()).reduce((sum, v) => sum + v, 0);
  const workerProfitBaseAED = singleWorkerId ? profitAED - coworkerTotalAED : null;

  // Actual saved Profit from specific sales (modal overrides)
  let workerModalProfitAED = 0;
  const coworkerModalProfitMap = new Map();

  sales.forEach(s => {
    if (singleWorkerId) workerModalProfitAED += Number(s.worker_profit || 0);
    const cp = Number(s.coworker_profit || 0);
    const cid = s.coworker_id || s.collaboration;
    if (cp && cid) {
      const keys = Array.isArray(cid) ? cid : [cid];
      keys.forEach(k => {
        const key = String(k);
        coworkerModalProfitMap.set(key, (coworkerModalProfitMap.get(key) || 0) + cp);
      });
    }
  });

  return {
    expenseTotals,
    saleTotals,
    profitAED,
    profitUSD,
    profitRUB,
    singleWorkerId,
    workerProfitBaseAED,
    workerModalProfitAED,
    coworkerMap,
    coworkerModalProfitMap,
    rateAEDUSD,
    rateRUBUSD,
  };
}
