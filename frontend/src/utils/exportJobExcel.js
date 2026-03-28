
import { calculateFullJobSummary } from "./job_calc";
import { toAED } from "./currency";

/**
 * High-fidelity Excel export generator.
 * Produces a grid-based spreadsheet matching the user's requested layout.
 */
export async function exportJobSummaryToExcel(job, filename, workerNameMap = {}) {
  if (!job || typeof job !== "object") {
    alert("No job data to export");
    return;
  }

  const XLSX = await import("xlsx");
  
  // Use shared calc engine
  const summary = calculateFullJobSummary(job);
  const {
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
  } = summary;

  const getName = (v) => (typeof v === "object" && v !== null ? (v.name ?? "") : (v ?? ""));
  const val = (v) => (v ?? "");

  // Start with Main Part (A and B columns)
  const aoa = [
    ["Name", "Value"],
    ["BN Number", val(job.bnNumber)],
    ["Refer BN", val(job.referBN)],
    ["Client", getName(job.client)],
    ["Carrier", val(job.carrier)],
    ["Shipper", val(job.shipper)],
    ["Consignee", getName(job.consignee)],
    ["Commodity", val(job.commodity)],
    ["Quantity", val(job.quantity)],
    ["Weight", val(job.weight)],
    ["Port of Loading", val(job.portLoading)],
    ["Port of Discharge", val(job.portDischarge)],
    ["Payment Terms", val(job.paymentTerms)],
    ["Payment Location", val(job.paymentLocation)],
    ["Payer Company", getName(job.payerCompany)],
    ["AED→USD", val(job.rateAEDUSD)],
    ["RUB→USD", val(job.rateRUBUSD)],
    ["AED→EUR", val(job.rateAEDEUR)],
    ["Service done (ON = not delivered)", job.service_not_delivered ? "ON" : "OFF"],
    ["Archive (lock editing)", job.archived ? "ON" : "OFF"],
    [], // Spacer
  ];

  const fx = { AED_to_USD: rateAEDUSD, RUB_to_USD: rateRUBUSD };
  const formatNum = (n) => (Number.isFinite(n) ? n.toFixed(2) : "0.00");
  const formatRub = (n) => (Number.isFinite(n) ? Math.round(n).toString() : "0");

  const getVals = (amt, curr) => {
    const aed = toAED(amt, curr, fx);
    const usd = rateAEDUSD ? aed / rateAEDUSD : 0;
    const rub = rateRUBUSD ? usd * rateRUBUSD : 0;
    return [aed, usd, rub];
  };

  // --- EXPENSES ---
  aoa.push(["--- EXPENSES ---", "AED", "USD", "RUB"]);
  (job.expenses || []).forEach((ex, i) => {
    const total = (Number(ex.quantity) || 0) * (Number(ex.unit_cost) || 0);
    const [aed, usd, rub] = getVals(total, ex.currency || "USD");
    aoa.push([
      `${i + 1}. ${ex.description || "Expense"}`,
      formatNum(aed),
      formatNum(usd),
      formatRub(rub)
    ]);
  });
  
  const exRUB = rateRUBUSD ? expenseTotals.sumUSD * rateRUBUSD : 0;
  aoa.push([
    "TOTAL EXPENSES",
    formatNum(expenseTotals.sumAED),
    formatNum(expenseTotals.sumUSD),
    formatRub(exRUB)
  ]);

  aoa.push([]); // Spacer
  
  // --- SALES ---
  aoa.push(["--- SALES ---", "AED", "USD", "RUB"]);
  (job.sales || []).forEach((sa, i) => {
    const total = (Number(sa.quantity) || 0) * (Number(sa.unit_price) || 0);
    const [aed, usd, rub] = getVals(total, sa.currency || "USD");
    aoa.push([
      `${i + 1}. ${sa.description || "Sale"}`,
      formatNum(aed),
      formatNum(usd),
      formatRub(rub)
    ]);
  });

  const saRUB = rateRUBUSD ? saleTotals.sumUSD * rateRUBUSD : 0;
  aoa.push([
    "TOTAL SALES",
    formatNum(saleTotals.sumAED),
    formatNum(saleTotals.sumUSD),
    formatRub(saRUB)
  ]);

  aoa.push([]); // Spacer

  // --- PROFITABILITY ---
  aoa.push(["--- PROFITABILITY ---", "AED", "USD", "RUB"]);
  aoa.push([
    "TOTAL PROFIT",
    formatNum(profitAED),
    formatNum(profitUSD),
    formatRub(profitRUB)
  ]);

  aoa.push([]); // Spacer

  // Worker Section
  const workerName = singleWorkerId ? (workerNameMap[singleWorkerId] || singleWorkerId) : "";
  const wRowBase = [`Worker ${workerName} profit base:`];
  if (workerProfitBaseAED != null) {
      wRowBase[1] = formatNum(workerProfitBaseAED);
      wRowBase[2] = formatNum(workerProfitBaseAED / rateAEDUSD);
      wRowBase[3] = formatRub((workerProfitBaseAED / rateAEDUSD) * rateRUBUSD);
  }
  aoa.push(wRowBase);

  const wRowProfit = [`Worker ${workerName} profit:`];
  if (workerModalProfitAED != null) {
      wRowProfit[1] = formatNum(workerModalProfitAED);
      wRowProfit[2] = formatNum(workerModalProfitAED / rateAEDUSD);
      wRowProfit[3] = formatRub((workerModalProfitAED / rateAEDUSD) * rateRUBUSD);
  }
  aoa.push(wRowProfit);

  aoa.push([]); // Spacer

  // Coworkers Section (Vertical list as requested)
  Array.from(coworkerMap.entries()).forEach(([id, valAED]) => {
    const cName = workerNameMap[id] || id;
    const cRowBase = [`Coworker ${cName} profit base:`, formatNum(valAED), formatNum(valAED / rateAEDUSD), formatRub((valAED / rateAEDUSD) * rateRUBUSD)];
    aoa.push(cRowBase);

    const mProfit = coworkerModalProfitMap.get(id) || 0;
    const cRowProfit = [`Coworker ${cName} profit:`, formatNum(mProfit), formatNum(mProfit / rateAEDUSD), formatRub((mProfit / rateAEDUSD) * rateRUBUSD)];
    aoa.push(cRowProfit);
    aoa.push([]); // Spacer between coworkers
  });

  // Create Sheet
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Auto-width for A, B, C, D columns
  const colWidths = [0, 1, 2, 3].map(colIdx => {
    return {
      wch: Math.max(...aoa.map(row => (row[colIdx] ? String(row[colIdx]).length : 0)), 10) + 2
    };
  });
  ws["!cols"] = colWidths;

  // Finalize Workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Job");
  const fname = filename || (job.bnNumber ? `Job_${job.bnNumber}.xlsx` : `Job_Export.xlsx`);
  XLSX.writeFile(wb, fname);
}
