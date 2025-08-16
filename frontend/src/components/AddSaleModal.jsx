import { useState, useEffect, useMemo } from "react";
import API from "../api";
import { toAED } from "../utils/currency";
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


  // показываем числа ТОЛЬКО когда оба поля > 0
  const bothField = formData.qty !== "" && formData.unit_price !== "";
  const amountStr = bothField ? amount.toFixed(4) : "";
  const amountAED = useMemo(() => (
    bothField ? toAED(amount, formData.currency || "USD", rates) : 0
  ), [bothField, amount, formData.currency, rates]);

  const amountAEDStr = bothField ? amountAED.toFixed(4) : "";


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
    onSave({ ...formData, amount });
    setIsEdited(false);
  };

    //вычисляем Amount in AED здесь же (точность финального сохранения не страдает)
  const amount_aed = toAED(amount, formData.currency || "USD", rates);



  const handleClose = () => {
    if (isEdited) {
      if (confirm("Save changes before closing?")) {
        const amount_aed = toAED(amount, formData.currency || "USD", rates);
        onSave({ ...formData, amount });
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
              placeholder="Qty"
              type="number"
              value={formData.qty ?? ""}
              onChange={(e) => handleChange("qty", parseFloat(e.target.value) || 0)}
            />

            {/* Unit Price */}
            <input
              placeholder="Unit Price"
              type="number"
              value={formData.unit_price ?? ""}
              onChange={(e) => handleChange("unit_price", parseFloat(e.target.value) || 0)}
            />

            {/* Amount авто */}
            <div>Amount: {amountStr || "-"}</div>

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

            <div>Amount in AED: {amountAEDStr || "-"}</div>

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
