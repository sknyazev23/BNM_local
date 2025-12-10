import { useState, useEffect, useMemo } from "react";
import API from "../api";
import { toAED } from "../utils/currency";
import { format4 } from "../utils/numberFormat";
import { onlyPositiveDecimal4, blockPaste, decimal4Change, decimal4Blur } from "../utils/numberValidation";
import PlanFactToggle from "./PlanFactToggle";
import "../styles/modal.css";

export default function AddSaleModal({
  isOpen,
  onClose,
  onSave,
  existingData = {},
  displayNo,
  rates,
  jobId

  }) {
  const [formData, setFormData] = useState({});
  const [isEdited, setIsEdited] = useState(false);
  const [workersList, setWorkersList] = useState([]);

  // автопересчёт Amount
  const amount = useMemo(() => {
    const q = parseFloat(formData.qty) || 0;
    const u = parseFloat(formData.unit_price) || 0;
    const res = q * u;
    return Number.isFinite(res) ? res : 0;
  }, [formData.qty, formData.unit_price]);


  // показываем числа ТОЛЬКО когда оба поля > 0
  const showAmounts = Number(formData.qty) > 0 && Number(formData.unit_price) > 0;
  const amountStr = showAmounts ? format4(amount) : "";
  const amountAED = useMemo(() => (
    showAmounts ? toAED(amount, formData.currency || "USD", rates) : 0
  ), [showAmounts, amount, formData.currency, rates]);

  const amountAEDStr = showAmounts ? format4(amountAED) : "";


  useEffect(() => {
    if (isOpen) {
      API.get("/workers/")
        .then(res => {
          const normalized = res.data.map(w => ({
            ...w,
            id: w.id || String(w._id || w.id)
          }));
          setWorkersList(normalized);
        })
        .catch(err => {console.error("Error loading workers", err);
        setWorkersList([]);
      });
    } else {
    setWorkersList([]);
    }
  }, [isOpen]);


  // Open and load
  useEffect(() => {
    setFormData({ ...existingData,
      status: existingData.status || "plan"
    });
    setIsEdited(false);
  }, [existingData, isOpen]);


  // отслеживаем изменения
  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    setIsEdited(true);
  };

  // Form of Sale modal
  const formSale = () => {
    if (!formData.description?.trim()) {
      alert("Sale description is required!");
      return null;
    }
  
    const qty = parseInt(formData.qty || 0, 10);
    const unit_price_origin = parseFloat(formData.unit_price || 0);
    const currency_origin = formData.currency || "USD";
    const amount_origin = qty * unit_price_origin;
    const amount_aed = toAED(amount_origin, currency_origin, rates);
    const mainWorker = workersList.find(w => w.id === formData.worker);
    const coworker = workersList.find(w => w.id === formData.collaboration);


    return {
      job_id: jobId,
      description: formData.description.trim(),
      qty,
      unit_price_origin,
      currency_origin: formData.currency || "USD",
      amount_origin,
      amount_aed,
      worker_id: formData.worker || null,
      worker_name: mainWorker?.name || null,
      coworker_name: coworker?.name || null,
      date_client_payment: formData.date_client_payment || null,
      client_payment_note: formData.client_payment_note?.trim() || null,
      rate_of_payment: parseFloat(formData.rate_of_payment || 0) || null,
      sale_status: formData.status || "plan",
      edit_date: new Date().toISOString(),
    };
  };

  // save
  const handleSave = async (e) => {
    e.preventDefault();

    const payload = formSale();
    if (!payload) return;

    console.log("Отправляем продажу в MongoDB:", payload);

    try {
      await API.post("/sales", payload);
      onSave(payload);
      onClose();
    } catch (err) {
      console.error("Ошибка сохранения продажи:", err.response?.data || err.message);
      alert("Ошибка сохранения продажи. Открой консоль (F12) → вкладка Console");
    }
  };


  const handleClose = () => {
    if (isEdited) {
      if (confirm("Save changes before closing?")) {
        const payload = formSale();
        if(!payload) return;

        onSave(payload);
      }
    }
    onClose();
  };


  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-no"># {displayNo}</div>
        <h3 className="modal-title">Add Sale</h3>

        <form onSubmit={handleSave}>
          <div className="modal-grid">

            <input
              placeholder="Sale description"
              value={formData.description || ""}
              onChange={(e) => handleChange("description", e.target.value)}
            />

            {/* Qty */}
            <input
              placeholder="Quantity"
              type="number"
              min="0"
              step="1"
              value={formData.qty != null ? formData.qty : ""}
              onKeyDown={(e) => {
                if (['-', '+', 'e', 'E', '.', ',', ' '].includes(e.key)) e.preventDefault();
              }}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "") {
                  handleChange("qty", "");
                  return;
                }
                const n = parseInt(v, 10);
                handleChange("qty", Number.isFinite(n) ? Math.max(0, n) : 0);
              }}
              onBlur={(e) => {
                const n = parseInt(e.target.value, 10);
                const cleaned = Number.isFinite(n) ? Math.max(0, n) : "";
                e.target.value = String(cleaned);     // выравниваем видимое значение
                handleChange("qty", cleaned);
              }}
            
            />

            {/* Unit Price */}
            <input
              placeholder="Unit Price"
              type="text"
              inputMode="decimal"
              value={formData.unit_price ?? ""}
              onKeyDown={onlyPositiveDecimal4}
              onPaste={blockPaste}
              onChange={decimal4Change((v) => handleChange("unit_price", v))}
              onBlur={decimal4Blur((v) => handleChange("unit_price", v))}
            />

            {/* Amount авто */}
            <div>Amount: {amountStr}</div>

            {/* Currency */}
            <select
              value={formData.currency || "USD"}
              onChange={(e) => handleChange("currency", e.target.value)}
            >
              <option value="USD">USD</option>
              <option value="AED">AED</option>
              <option value="RUB">RUB</option>
              <option value="EUR">EUR</option>
            </select>

            <div>Amount in AED: {amountAEDStr}</div>

            {/* Choose worker (main) */}
            <select
              value={formData.worker || ""}
              onChange={(e) => handleChange("worker", e.target.value)}
            >
              <option value="">Choose worker</option>
              {workersList.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name} {w.role ? `(${w.field})` : ""}
                </option>
              ))}
            </select>

            {/* в DB, не на Job form */}

            {/* Date of client payment */}
            <input
              type={formData.date_client_payment ? "date" : "text"}
              placeholder="Date of client payment"
              value={formData.date_client_payment || ""}
              onFocus={(e) => (e.target.type = "date")}
              onBlur={(e) => { if (!e.target.value) e.target.type = "text"; }}
              onChange={(e) => handleChange("date_client_payment", e.target.value)}
            />

            {/* Client payment note */}
            <textarea
              placeholder="Client payment note"
              rows={2}
              value={formData.client_payment_note || ""}
              onChange={(e) => handleChange("client_payment_note", e.target.value)}
            />

            {/* Rate of payment (валидация currency rate) */}
            <input
              type="text"
              inputMode="decimal"
              placeholder="Rate of payment"
              value={formData.rate_of_payment || ""}
              onKeyDown={onlyPositiveDecimal4}
              onPaste={blockPaste}
              onChange={decimal4Change((v) => handleChange("rate_of_payment", v))}
              onBlur={decimal4Blur((v) => handleChange("rate_of_payment", v))}
            />

            {/* Collaboration */}
            <select
              value={formData.collaboration || ""}
              onChange={(e) => handleChange("collaboration", e.target.value)}
            >
              <option value="">Choose coworker</option>
              {workersList.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-footer">
            <button type="submit">Save</button>
            <button type="button" onClick={handleClose}>Close</button>
          </div>
        </form>

        <div className="modal-date">
          <PlanFactToggle
            value={formData.status === "plan"}
            onChange={(newValue) => handleChange("status", newValue ? "plan" : "fact")} />
          <div className="date-text">
          {new Date().toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "long",
            year: "numeric"
          })}
          </div>
        </div>
      </div>
    </div>
  );
}
