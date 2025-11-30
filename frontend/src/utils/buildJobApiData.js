import { ddmmyyyyToISO } from "./dateFmt";

export function buildJobApiData(raw, { serviceDone, archived }) {
  const clientObj = typeof raw.client === "object" && raw.client ? raw.client : null;
  const client_id =
    clientObj?.id ?? clientObj?._id ?? (typeof raw.client === "string" ? raw.client : "");
  const client_name =
    clientObj?.name ?? (typeof raw.client === "string" ? raw.client : "");

  const main_part = {
    bn_number: (raw.bnNumber || "").trim(),
    refer_bn: (raw.referBN || "").trim(),
    client_id: String(client_id || "").trim(),
    client_name: String(client_name || "").trim(),
    carrier: raw.carrier || null,
    shipper: raw.shipper || null,
    consignee:
      typeof raw.consignee === "object" ? (raw.consignee?.name || null) : (raw.consignee || null),
    commodities: raw.commodity || null,
    quantity: raw.quantity !== "" ? Number(raw.quantity) : null,
    weight: raw.weight !== "" ? Number(raw.weight) : null,
    port_loading: raw.portLoading || null,
    port_discharge: raw.portDischarge || null,
    payment_terms: raw.paymentTerms || null,
    payment_location: raw.paymentLocation || null,
    payer_company:
      typeof raw.payerCompany === "object"
        ? (raw.payerCompany?.name || null)
        : (raw.payerCompany || null),
    rate_aed_to_usd: raw.rateAEDUSD !== "" ? Number(raw.rateAEDUSD) : null,
    rate_aed_to_eur: raw.rateAEDEUR !== "" ? Number(raw.rateAEDEUR) : null,
    rate_rub_to_usd: raw.rateRUBUSD !== "" ? Number(raw.rateRUBUSD) : null,
  };

  const expenses_part = (raw.expenses || []).map((e) => {
    const qty = Number(e.quantity ?? e.qty ?? 0);
    const unit = Number(e.unit_cost ?? 0);
    const currency = (e.currency || "USD").toUpperCase();
    return {
      description: e.description || "",
      quantity: Number.isFinite(qty) ? qty : 0,
      unit_cost: Number.isFinite(unit) ? unit : 0,
      currency,
      seller: e.seller || undefined,
      workers: e.worker
        ? [String(e.worker)]
        : Array.isArray(e.workers)
          ? e.workers.map(String)
          : [],
      status: String(e.status || "plan").toLowerCase() === "fact" ? "fact" : "plan",
    };
  });

  const sale_part = (raw.sales || []).map((s) => {
    const qty = Number(s.qty ?? 0);
    const unit = Number(s.unit_price ?? 0);
    const total = Number.isFinite(qty * unit) ? Number((qty * unit).toFixed(4)) : 0;
    const currency = (s.currency || "USD").toUpperCase();
    return {
      description: s.description || "",
      amount: { [currency]: total },
      workers: s.worker
        ? [String(s.worker)]
        : Array.isArray(s.workers)
          ? s.workers.map(String)
          : [],
      status: String(s.status || "plan").toLowerCase() === "fact" ? "fact" : "plan",
    };
  });

  const delivery_date = serviceDone ? `${ddmmyyyyToISO(serviceDone)}T00:00:00Z` : null;

  return {
    status: "open",
    archived: !!archived,
    delivery_date,
    main_part,
    expenses_part,
    sale_part,
  };
}
