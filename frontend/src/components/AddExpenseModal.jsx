import { useState, useEffect, useMemo } from "react";
import API from "../api";
import "../styles/modal.css";
import "../styles/planFact.css";
import { format4 } from "../utils/numberFormat";
import { toAED } from "../utils/currency";
import PlanFactToggle from "./PlanFactToggle";

export default function AddExpenseModal({ isOpen, onClose, onSave, existingData = {}, displayNo, rates, sales = [] }) {
  const [formData, setFormData] = useState({});
  const [isEdited, setIsEdited] = useState(false);
  const [workersList, setWorkersList] = useState([]);
  const [isPlan, setIsPlan] = useState(true);

  // пересчет для Amount
  const amount = useMemo(() => {
    const q = parseFloat(formData.quantity) || 0;
    const u = parseFloat(formData.unit_cost) || 0;
    const res = q*u;
    return Number.isFinite(res) ? res : 0;
  }, [formData.quantity, formData.unit_cost]);

  // amount in AED
  const showAmmounts = Number(formData.quantity) > 0 && Number(formData.unit_cost) > 0;
  const amountAED = useMemo(() => (
    showAmmounts ? toAED(amount, formData.currency || "USD", rates) : 0
  ), [showAmmounts, amount, formData.currency, rates]);


  const showAmount =
    Number(formData.quantity) > 0 && Number(formData.unit_cost) > 0; 

  const isRequiredText = (v) => typeof v === "string" && v.trim().length > 0;

  const getIsPlan = (ed = {}) => typeof ed.is_plan === "boolean" ? ed.is_plan
    : typeof ed.status === "string" ? ed.status.toLowerCase() === "plan" : true;
  

  useEffect(() => {
    if (isOpen) {
      API.get("/workers/")
        .then(res => setWorkersList(res.data))
        .catch(err => console.error("Error loading workers", err));
    }
  }, [isOpen]);

  // Загружаем данные при открытии
  useEffect(() => {
    const ed = existingData || {};
    setFormData({ ...ed, binded_sale: ed.binded_sale ?? ""});
    setIsEdited(false);
    setIsPlan(getIsPlan(ed));
  }, [existingData, isOpen]);

  // Отслеживание изменений
  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    setIsEdited(true);
  };

  // Сохранение
  const handleSave = (e) => {
    e.preventDefault();
    if (!isRequiredText(formData.description)) {
      alert("Cost description is required!");
      return;
    }
    onSave({...formData, amount, is_plan: isPlan});
    setIsEdited(false);
  };

  // Закрытие с проверкой изменений
  const handleClose = () => {
    if (isEdited) {
      if (confirm("Save changes before closing?")) {
        if (!isRequiredText(formData.description)) {
          alert("Cost description is required!");
          return;
        }
        onSave({ ...formData, amount });
      }
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-no"># {displayNo}</div>
        <h3 className="modal-title">Add Expense</h3>

        <form onSubmit={handleSave}>
          <div className="modal-grid">
            
            <input placeholder="Cost description" value={formData.description || ""} onChange={(e) => handleChange("description", e.target.value)} />
            <input
              placeholder="Quantity"
              type="number"
              min="0"
              step="1"
              value={formData.quantity ?? ""}
              onKeyDown={(e) => {
                if (['-', '+', 'e', 'E', '.', ',', ' '].includes(e.key)) e.preventDefault();
              }}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "") {
                  handleChange("quantity", "");
                  return;
                }
                const n = parseInt(v, 10);
                handleChange("quantity", Number.isFinite(n) ? Math.max(0, n) : 0);
              }}
              onBlur={(e) => {
                const n = parseInt(e.target.value, 10);
                const cleaned = Number.isFinite(n) ? Math.max(0, n) : "";
                e.target.value = String(cleaned);
                handleChange("quantity", cleaned);
              }}
            />

            <input placeholder="Cost per unit" type="number" value={formData.unit_cost || ""}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "") return handleChange("unit_cost", "");
              const n = parseFloat(v);
              handleChange("unit_cost", Number.isFinite(n) ? n : "");
            }} />
            <div>Amount: {showAmount ? format4(amount) : ""}</div>

            <select value={formData.currency || ""} onChange={(e) => handleChange("currency", e.target.value)}>
              <option value="">Currency</option>
              <option value="USD">USD</option>
              <option value="AED">AED</option>
              <option value="RUB">RUB</option>
              <option value="EUR">EUR</option>
            </select>

            <div>Cost amount in AED: {showAmount ? format4(amountAED) : ""}</div>


            <input placeholder="Seller" value={formData.seller || ""} onChange={(e) => handleChange("seller", e.target.value)} />

            <select value={formData.worker || ""} onChange={(e) => handleChange("worker", e.target.value)}>
              <option value="">Choose worker</option>
              {workersList.map(w => (
                <option key={w.id || w._id} value={w.id || w._id}>{w.name}</option>
              ))}
            </select>

            {/* Binded Sale */}
            <select
              value={formData.binded_sale ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                handleChange("binded_sale", v === "" ? "" : Number(v));
              }}
            >
              <option value="">Binded Sale</option>
              {sales.map((s, idx) => (
                <option key={s.id || s._id || idx} value={idx}>
                  {(s.description && s.description.trim()) ? s.description : `Sale #${idx + 1}`}
                </option>
              ))}
            </select>

            <input
              type={formData.payment_date_to_seller ? "date" : "text"}
              placeholder="Date of our payment to Seller"
              value={formData.payment_date_to_seller || ""}
              onFocus={(e) => (e.target.type = "date")}
              onBlur={(e) => { if (!e.target.value) e.target.type = "text"; }}
              onChange={(e) => handleChange("payment_date_to_seller", e.target.value)}
            />

            <textarea
              placeholder="Payment note"
              rows={2}
              value={formData.payment_note || ""}
              onChange={(e) => handleChange("payment_note", e.target.value)}
            />


          </div>

          <div className="modal-footer">
            <button onClick={handleSave}>Save</button>
            <button type="button" onClick={handleClose}>Close</button>
          </div>
        </form>

        <div className="modal-date">
          <PlanFactToggle value={isPlan} onChange={setIsPlan} />
          <time className="date-text">
          {new Date().toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "long",
            year: "numeric"
          })}
          </time>
        </div>
      </div>
    </div>
  );
}
