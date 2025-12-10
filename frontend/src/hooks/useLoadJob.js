
import { useEffect, useState } from "react";
import { isoToDDMMYYYY } from "../utils/dateFmt";
import API from "../api";

export default function useLoadJob(routeId, setters) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoaded(false);

    const isNewJob = routeId && /^BN\d{8}-\d{6}$/.test(routeId);

    if (!routeId || routeId === "new" || isNewJob) {
      if (alive) setLoaded(false);
      return;
    }

    (async () => {
      try {
        // 1-я попытка: /jobs/{_id}
        let res;
        try {
          res = await API.get(`/jobs/${routeId}`);
        } catch {
          // 2-я попытка (если вдруг у тебя есть альтернативный эндпоинт)
          res = await API.get(`/jobs/by-id/${routeId}`);
        }
        if (!alive) return;

        const job = res.data || {};
        const mp = job.main_part || {};

        // _id
        setters.setMongoId?.(job._id ?? routeId);

        // --- main_part
        setters.setBnNumber?.(mp.bn_number || "");
        setters.setReferBN?.(mp.refer_bn || "");

        if (mp.client_name) {
          setters.setClient?.({ id: mp.client_id || "", name: mp.client_name });
        } else {
          setters.setClient?.("");
        }

        setters.setCarrier?.(mp.carrier || "");
        setters.setShipper?.(mp.shipper || "");
        setters.setConsignee?.(mp.consignee || "");
        setters.setCommodity?.(mp.commodities || "");
        setters.setQuantity?.(mp.quantity != null ? String(mp.quantity) : "");
        setters.setWeight?.(mp.weight != null ? String(mp.weight) : "");
        setters.setPortLoading?.(mp.port_loading || "");
        setters.setPortDischardge?.(mp.port_discharge || "");
        setters.setPaymentTerms?.(mp.payment_terms || "");
        setters.setPaymentLocation?.(mp.payment_location || "");
        setters.setPayerCompany?.(mp.payer_company || "");

        setters.setRateAEDUSD?.(
          mp.rate_aed_to_usd != null ? String(mp.rate_aed_to_usd) : "3.6700"
        );
        setters.setRateRUBUSD?.(
          mp.rate_rub_to_usd != null ? String(mp.rate_rub_to_usd) : ""
        );
        setters.setRateAEDEUR?.(
          mp.rate_aed_to_eur != null ? String(mp.rate_aed_to_eur) : ""
        );

        setters.setServiceDone?.(job.serviceDone ? isoToDDMMYYYY(job.serviceDone) : (job.delivery_date ? isoToDDMMYYYY(job.delivery_date) :""));
        setters.setArchived?.(Boolean(job.archived));   

        // --- маппинг Expenses
        const mapExpense = (e = {}) => {
          const qty = e.quantity != null ? Number(e.quantity) : 1;
          const unit = e.unit_cost != null ? Number(e.unit_cost) : undefined;
          const dict = e.cost || {};
          const curFromCost = ("USD" in dict && "USD") || Object.keys(dict)[0];
          const amountFromCost = dict[curFromCost || ""] != null ? Number(dict[curFromCost]) : undefined;
          const currency = (e.currency || curFromCost || "USD").toUpperCase();
          const unit_cost = unit != null ? unit : (amountFromCost != null ? amountFromCost : 0);

          return {
            description: e.description || "",
            quantity: Number.isFinite(qty) ? qty : 0,
            unit_cost: Number.isFinite(unit_cost) ? unit_cost : 0,
            currency,
            seller: e.seller || "",
            worker: (Array.isArray(e.workers) && e.workers[0]) || e.worker || "",
            status: (e.status || "plan").toString().toLowerCase() === "fact" ? "fact" : "plan",
          };
        };

        // --- маппинг Sales
        const mapSale = (s = {}) => {
          const qty = s.qty != null ? Number(s.qty) : undefined;
          const up  = s.unit_price != null ? Number(s.unit_price) : undefined;
          const dict = s.amount || {};
          const curFromAmount = ("USD" in dict && "USD") || Object.keys(dict)[0];
          const amountFromDict = dict[curFromAmount || ""] != null ? Number(dict[curFromAmount]) : undefined;
          const currency = (s.currency || curFromAmount || "USD").toUpperCase();
          const unit_price = up != null ? up : (amountFromDict != null ? amountFromDict : 0);
          const qtyFinal   = qty != null ? qty : 1;

          return {
            description: s.description || "",
            qty: Number.isFinite(qtyFinal) ? qtyFinal : 0,
            unit_price: Number.isFinite(unit_price) ? unit_price : 0,
            currency,
            worker: (Array.isArray(s.workers) && s.workers[0]) || s.worker || "",
            status: (s.status || "plan").toString().toLowerCase() === "fact" ? "fact" : "plan",
          };
        };

        setters.setExpenses?.((job.expenses_part || []).map(mapExpense));
        setters.setSales?.((job.sale_part || []).map(mapSale));
        if(alive) setLoaded(true);

      } catch (err) {
        console.error("Failed to load job", err);
        if (err.response?.status !== 404) {
          alert("Error loading job: " + (err.message || "unknown"));
        }

        if (alive) setLoaded(false);
      }
    })();

    return () => { alive = false; };
  }, [routeId]);

  return { loaded };
}