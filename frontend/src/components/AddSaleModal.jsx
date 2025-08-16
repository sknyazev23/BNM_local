import { useState, useEffect, useMemo } from "react";
import API from "../api";
import { toAED } from "../utils/currency";
import { format4 } from "../utils/numberFormat";
import { onlyPositiveDecimal4, blockPaste, decimal4Change, decimal4Blur } from "../utils/numberValidation";
import "../styles/modal.css";

export default function AddSaleModal({ isOpen, onClose, onSave, existingData = {}, workers, rates }) {
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

  const isRequiredText = (v) => typeof v === "string" && v.trim().length > 0;


  // показываем числа ТОЛЬКО когда оба поля > 0
  const showAmmounts = Number(formData.qty) > 0 && Number(formData.unit_price) > 0;
  const amountStr = showAmmounts ? format4(amount) : "";
  const amountAED = useMemo(() => (
    showAmmounts ? toAED(amount, formData.currency || "USD", rates) : 0
  ), [showAmmounts, amount, formData.currency, rates]);

  const amountAEDStr = showAmmounts ? format4(amountAED) : "";


  useEffect(() => {
    if (isOpen) {
      API.get("/workers/")
        .then(res => setWorkersList(res.data))
        .catch(err => console.error("Error loading workers", err));
    }
  }, [isOpen]);

  // загрузка данных при открытии (включая доп. поля)
  useEffect(() => {
    setFormData(existingData || {});
    setIsEdited(false);
  }, [existingData, isOpen]);

  // отслеживаем изменения
  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    setIsEdited(true);
  };

  // сохранение
  const handleSave = (e) => {
    e.preventDefault();
    if (!isRequiredText(formData.description)) {
      alert("Sale description is required!");
      return;
    }
    const amount_aed = toAED(amount, formData.currency || "USD", rates);
    onSave({ ...formData, amount, amountAED });
    setIsEdited(false);
  };

  const handleClose = () => {
    if (isEdited) {
      if (confirm("Save changes before closing?")) {
        if (!isRequiredText(formData.description)) {
          alert("Sale description is required!");
          return;
        }
        const amount_aed = toAED(amount, formData.currency || "USD", rates);
        onSave({ ...formData, amount, amountAED });
      }
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 className="modal-title">Add Sale</h3>

        <form onSubmit={handleSave}>
          <div className="modal-grid">
            {/* # */}
            <input
              placeholder="#"
              value={formData.no || ""}
              onChange={(e) => handleChange("no", e.target.value)}
            />

            {/* Description (обязательна по ТЗ, как в AddExpenseModal — без html required) */}
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
              value={formData.qty ?? ""}
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
                const cleaned = Number.isFinite(n) ? Math.max(0, n) : 0;
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

            {/* Choose worker (один ответственный) */}
            <select
              value={formData.worker || ""}
              onChange={(e) => handleChange("worker", e.target.value)}
            >
              <option value="">Choose worker</option>
              {workersList.map(w => (
                <option key={w.id || w._id} value={w.id || w._id}>
                  {w.name}
                </option>
              ))}
            </select>

            {/* Доп. поля: в DB, не на Job form, не обязательны */}

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
                <option key={w.id || w._id} value={w.id || w._id}>
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
          {new Date().toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </div>
      </div>
    </div>
  );
}
