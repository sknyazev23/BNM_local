import { ddmmyyyyToISO } from "./dateFmt";

export function buildJobApiData(raw, { serviceDone, archived }) {
  const clientObj = typeof raw.client === "object" && raw.client ? raw.client : null;
  const client_id =
    clientObj?.id ?? clientObj?._id ?? (typeof raw.client === "string" ? raw.client : "");
  const client_name =
    clientObj?.name ?? (typeof raw.client === "string" ? raw.client : "");
  const now = new Date().toISOString();


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
    if (!e.sale_id) {
      throw new Error("Каждая расходная запись должна быть привязана к sale_id");
    }
    
    const quantity = Number(e.quantity ?? 0);
    const unit = Number(e.unit_cost ?? 0);
    const currency = (e.currency || "USD").toUpperCase();

    const amount_origin = Number.isFinite(quantity * unit)
      ? Number((quantity * unit).toFixed(4))
      : 0;

    return {
      job_id: e.job_id || raw.job_id,
      sale_id: e.sale_id,

      description: e.description || "",
      quantity: Number.isFinite(quantity) ? quantity : 0,
      unit_cost_origin: Number.isFinite(unit) ? unit : 0,
      currency_origin: currency,
      amount_origin,
      amount_aed: 0,

      seller: e.seller || null,
      worker_id: e.worker ? String(e.worker) : null,
      worker_name: e.workerName || null,

      date_to_seller_payment: e.datePayment || null,
      payment_note: e.paymentNote || null,
      binded_sale: e.bindedSale ?? null,

      cost_status:
        String(e.status || "plan").toLowerCase() === "fact" ? "fact" : "plan",

      edit_date: e.edit_date || now
    };
  });


  const sales_part = (raw.sales || []).map((s) => {
    const quantity = Number(s.quantity ?? 0);
    const unit = Number(s.unit_price ?? 0);
    const currency = (s.currency || "USD").toUpperCase();

    const amount_origin = Number.isFinite(quantity * unit)
      ? Number((quantity * unit).toFixed(4))
      : 0;

    return {
      job_id: raw.job_id,
      description: s.description || "",
      quantity,
      unit_price_origin: unit,
      currency_origin: currency,
      amount_origin,
      amount_aed: 0,
      worker_id: s.worker ? String(s.worker) : null,
      worker_name: s.workerName || null,

      sale_status:
        String(s.status || "plan").toLowerCase() === "fact" ? "fact" : "plan",

      edit_date: s.edit_date || now
    };
  });


  const delivery_date = serviceDone ? `${ddmmyyyyToISO(serviceDone)}T00:00:00Z` : null;

  return {
    status: "open",
    archived: !!archived,
    delivery_date,
    main_part,
    expenses_part,
    sales_part,
  };
}
