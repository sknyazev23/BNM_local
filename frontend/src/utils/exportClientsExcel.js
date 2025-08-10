export async function exportClientsToExcel(clients, filename) {
  if (!Array.isArray(clients) || clients.length === 0) {
    alert("No data to export");
    return;
  }

  const XLSX = await import("xlsx");

  const rows = clients.map((c, i) => ({
    "#": i + 1,
    Name: c.name ?? "",
    VAT: c.vat_number ?? "",
    "Contact person": c.contact_person ?? "",
    Phone: c.phone ?? "",
    E_mail: c.mail ?? "",
    Country: c.country ?? "",
    Note: c.note ?? "",
  }));

  const ws = XLSX.utils.json_to_sheet(rows, {
    header: ["#", "Name", "VAT", "Contact person", "Phone", "E_mail", "Country", "Note"],
    skipHeader: false,
  });

  // авто-ширина колонок
  const fitToColumns = (data) =>
    Object.keys(data[0]).map((k) => ({
      wch: Math.max(k.length, ...data.map((r) => (r[k] ? String(r[k]).length : 0))) + 2,
    }));
  ws["!cols"] = fitToColumns(rows);

  // закрепить верхнюю строку (заголовки)
  ws["!freeze"] = { xSplit: 0, ySplit: 1 };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Clients");

  const fname =
    filename ||
    `clients_${new Date().toISOString().slice(0, 10)}.xlsx`;

  XLSX.writeFile(wb, fname);
}
