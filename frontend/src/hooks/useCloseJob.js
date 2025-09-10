import { useNavigate, useParams } from "react-router-dom";
import { useRef, useEffect } from "react";
import API from "../api";


export function buildJobData(fields) {
  const {
    bnNumber, referBN, client,
    carrier, shipper, consignee,
    commodity, quantity, weight,
    portLoading, portDischarge,
    paymentTerms, paymentLocation, payerCompany,
    rateAEDUSD, rateRUBUSD, rateAEDEUR,
    expenses = [], sales = [],
  } = fields;

  const main_part = {
    client_id: typeof client === "object" ? (client.id ?? client._id) : (client || ""),
    client_name: typeof client === "object" ? (client.name ?? "") : (client ?? ""),
    bn_number: bnNumber,
    refer_bn: referBN,
    carrier,
    shipper,
    consignee,
    commodities: commodity,
    quantity: Number(quantity) || 0,
    weight: weight === "" ? null : Number(weight),
    port_loading: portLoading,
    port_discharge: portDischarge,
    payment_terms: paymentTerms,
    payment_location: paymentLocation,
    payer_company: payerCompany,
    rate_aed_to_usd: parseFloat(rateAEDUSD) || null,
    rate_rub_to_usd: parseFloat(rateRUBUSD) || null,
    rate_aed_to_eur: parseFloat(rateAEDEUR) || null,
  };

  const expenses_part = expenses.map((e) => {
    const qty = Number(e.quantity ?? e.qty ?? 0);
    const unit = Number(e.unit_cost ?? 0);
    const amount = Number.isFinite(qty * unit) ? qty * unit : 0;
    const currency = e.currency || "USD";
    return {
      description: e.description ?? "",
      cost: { [currency]: amount },
      workers: e.worker ? [String(e.worker)] : [],
      status: e.status ?? "plan",
    };
  });

  const sale_part = sales.map((s) => {
    const qty = Number(s.qty ?? 0);
    const unit = Number(s.unit_price ?? 0);
    const amount = Number.isFinite(qty * unit) ? qty * unit : 0;
    const currency = s.currency || "USD";
    return {
      description: s.description ?? "",
      amount: { [currency]: amount },
      workers: s.worker ? [String(s.worker)] : [],
      status: s.status ?? "plan",
    };
  });

  return {
    status: "open",
    main_part,
    expenses_part,
    sale_part,
  };
}

/**
 * Управление выходом/закрытием Job: сохранение при необходимости, выход на Dashboard,
 * закрытие Job на бэке (опционально).
 *
 * @param {() => object} buildJobData — функция, возвращающая текущий payload формы
 * @param {() => Promise<void>} saveJob — функция сохранения
 * @param {string} jobMongoId — _id Job
 */
export default function useCloseJob(buildJobData, saveJob, jobMongoId) {
  const navigate = useNavigate();
  const { id: routeId } = useParams();
  const lastSavedRef = useRef("");

  const setSnapshot = () => {
    lastSavedRef.current = JSON.stringify(buildJobData());
  };

  const hasChanges = () => {
    return lastSavedRef.current !== JSON.stringify(buildJobData());
  };

  useEffect(() => {
    if (!lastSavedRef.current) setSnapshot();
  }, []);

  const maybeSave = async () => {
    if (!hasChanges()) return true;
    const doSave = confirm("Есть несохранённые изменения. Сохранить?");
    if (!doSave) return true;
    try {
      await saveJob();
      setSnapshot();
      return true;
    } catch (err) {
      const msg = err?.response?.data?.detail || err.message || "Unknown error";
      alert(`Сохранение не удалось: ${msg}`);
      return false;
    }
  };

  /** Просто выйти на Dashboard (без закрытия Job на сервере) */
  const exitToDashboard = async () => {
    const ok = await maybeSave();
    if (!ok) return;
    navigate("/dashboard");
  };

  /** Закрыть Job на бэке и вернуться на Dashboard */
  const closeAndReturn = async () => {
    const ok = await maybeSave();
    if (!ok) return;

    const idToClose = jobMongoId || routeId;
    if (idToClose && idToClose !== "new") {
      try {
        await API.patch(`/jobs/${idToClose}/close`);
      } catch (err) {
        const msg = err?.response?.data?.detail || err.message || "Unknown error";
        alert(`Закрыть Job не удалось: ${msg}`);
        return;
      }
    }
    navigate("/dashboard");
  };

  return { exitToDashboard, closeAndReturn, setSnapshot, hasChanges };
}
