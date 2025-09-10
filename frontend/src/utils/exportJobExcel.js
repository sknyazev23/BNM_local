
export async function exportJobSummaryToExcel(job, filename) {
  if (!job || typeof job !== "object") {
    alert("No job data to export");
    return;
  }

  const XLSX = await import("xlsx");

  const getName = (v) => (typeof v === "object" && v !== null ? (v.name ?? "") : (v ?? ""));
  const val = (v) => (v ?? "");

  // Собираем пары "Name / Value"
  const rows = [
    { Name: "BN Number", Value: val(job.bnNumber) },
    { Name: "Refer BN", Value: val(job.referBN) },
    { Name: "Client", Value: getName(job.client) },
    { Name: "Carrier", Value: val(job.carrier) },
    { Name: "Shipper", Value: val(job.shipper) },
    { Name: "Consignee", Value: getName(job.consignee) },
    { Name: "Commodity", Value: val(job.commodity) },
    { Name: "Quantity", Value: val(job.quantity) },
    { Name: "Weight", Value: val(job.weight) },
    { Name: "Port of Loading", Value: val(job.portLoading) },
    { Name: "Port of Discharge", Value: val(job.portDischarge) },
    { Name: "Payment Terms", Value: val(job.paymentTerms) },
    { Name: "Payment Location", Value: val(job.paymentLocation) },
    { Name: "Payer Company", Value: getName(job.payerCompany) },
    { Name: "AED→USD", Value: val(job.rateAEDUSD) },
    { Name: "RUB→USD", Value: val(job.rateRUBUSD) },
    { Name: "AED→EUR", Value: val(job.rateAEDEUR) },
    // Тумблеры
    { Name: "Service done (ON = not delivered)", Value: job.service_not_delivered ? "ON" : "OFF" },
    { Name: "Archive (lock editing)", Value: job.archived ? "ON" : "OFF" },
  ];

  // Создаём лист
  const ws = XLSX.utils.json_to_sheet(rows, {
    header: ["Name", "Value"],
    skipHeader: false,
  });

  // Авто-ширина колонок
  const headers = ["Name", "Value"];
  const cols = headers.map((k) => ({
    wch: Math.max(
      k.length,
      ...rows.map((r) => (r[k] ? String(r[k]).length : 0))
    ) + 2,
  }));
  ws["!cols"] = cols;

  // Закрепляем верхнюю строку
  ws["!freeze"] = { xSplit: 0, ySplit: 1 };

  // Книга и сохранение
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Job");
  const fname = filename || (job.bnNumber ? `Job_${job.bnNumber}.xlsx` : `Job_${new Date().toISOString().slice(0,10)}.xlsx`);
  XLSX.writeFile(wb, fname);
}
