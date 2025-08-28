import { useEffect } from "react";
import API from "../api";

export default function useLoadJob(routeId, setters) {
  useEffect(() => {
    if (!routeId || routeId === "new") return;

    (async () => {
      try {
        // 1-я попытка: /jobs/{_id}
        let res;
        try {
          res = await API.get(`/jobs/${routeId}`);
        } catch {
          // 2-я попытка (если есть альтернативный эндпоинт)
          res = await API.get(`/jobs/by-id/${routeId}`);
        }
        const job = res.data || {};
        const mp = job.main_part || {};

        if (setters.setMongoId) setters.setMongoId(job._id ?? routeId);

        // main_part
        setters.setBnNumber(mp.bn_number || "");
        setters.setReferBN(mp.refer_bn || "");
        if (mp.client_name) {
          // если ClientSelect ждёт объект {id,name}
          setters.setClient({ id: mp.client_id || "", name: mp.client_name });
        } else {
          setters.setClient("");
        }
        setters.setCarrier(mp.carrier || "");
        setters.setShipper(mp.shipper || "");
        setters.setConsignee(mp.consignee || "");
        setters.setCommodity(mp.commodities || "");
        setters.setQuantity(String(mp.quantity ?? ""));
        setters.setWeight(mp.weight == null ? "" : String(mp.weight));
        setters.setPortLoading(mp.port_loading || "");
        // соблюдаем текущее имя сеттера из формы
        setters.setPortDischardge(mp.port_discharge || "");
        setters.setPaymentTerms(mp.payment_terms || "");
        setters.setPaymentLocation(mp.payment_location || "");
        setters.setPayerCompany(mp.payer_company || "");

        setters.setRateAEDUSD(
          mp.rate_aed_to_usd != null ? String(mp.rate_aed_to_usd) : "3.6700"
        );
        setters.setRateRUBUSD(
          mp.rate_rub_to_usd != null ? String(mp.rate_rub_to_usd) : ""
        );
        setters.setRateAEDEUR(
          mp.rate_aed_to_eur != null ? String(mp.rate_aed_to_eur) : ""
        );

        // маппинг списков для UI-схемы
        const mapExpense = (e) => {
          const dict = e?.cost || {};
          const currency = ("USD" in dict && "USD") || Object.keys(dict)[0] || "USD";
          const amount = Number(dict[currency] || 0);
          return {
            description: e?.description || "",
            quantity: 1,
            unit_cost: amount,
            currency,
            seller: e?.seller || "",
            worker: (e?.workers && e.workers[0]) || "",
            status: e?.status || "plan",
          };
        };

        const mapSale = (s) => {
          const dict = s?.amount || {};
          const currency = ("USD" in dict && "USD") || Object.keys(dict)[0] || "USD";
          const amount = Number(dict[currency] || 0);
          return {
            description: s?.description || "",
            qty: 1,
            unit_price: amount,
            currency,
            worker: (s?.workers && s.workers[0]) || "",
            status: s?.status || "plan",
          };
        };

        setters.setExpenses((job.expenses_part || []).map(mapExpense));
        setters.setSales((job.sale_part || []).map(mapSale));
      } catch (err) {
        console.error("Failed to load job", err);
        alert("Не удалось загрузить Job");
      }
    })();
  }, [routeId]);
}
