// "DD-MM-YYYY" -> "YYYY-MM-DD"
export function ddmmyyyyToISO(dmy) {
  if (!dmy) return "";
  const [dd, mm, yyyy] = String(dmy).split("-");
  if (!dd || !mm || !yyyy) return "";
  return `${yyyy.padStart(4,"0")}-${mm.padStart(2,"0")}-${dd.padStart(2,"0")}`;
}

// "YYYY-MM-DD" -> "DD-MM-YYYY"
export function isoToDDMMYYYY(iso) {
  if (!iso) return "";
  const [yyyy, mm, dd] = String(iso).slice(0, 10).split("-");
  if (!dd || !mm || !yyyy) return "";
  return `${dd.padStart(2,"0")}-${mm.padStart(2,"0")}-${yyyy.padStart(4,"0")}`;
}
