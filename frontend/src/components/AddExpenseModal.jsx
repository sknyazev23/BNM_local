import { useState, useEffect, useMemo } from "react";
import API from "../api";
import "../styles/modal.css";
import "../styles/planFact.css";
import { format4 } from "../utils/numberFormat";
import { toAED } from "../utils/currency";
import PlanFactToggle from "./PlanFactToggle";

export default function AddExpenseModal({ isOpen, onClose, onSave, existingData = {}, displayNo, rates, job_id }) {
  const [sales, setSales] = useState([]);
  const [isEdited, setIsEdited] = useState(false);
  const [workersList, setWorkersList] = useState([]);
  const [isPlan, setIsPlan] = useState(true);
  const [formData, setFormData] = useState({
    description: "",
    sale_id: "",
    quantity: "",
    unit_cost: "",
    currency: "USD",
    seller: "",
    worker: "",
    date_to_seller_payment: "",
    payment_note: "",
  });


  // пересчет для Amount
  const amount = useMemo(() => {
    const q = parseFloat(formData.quantity) || 0;
    const u = parseFloat(formData.unit_cost) || 0;
    const res = q*u;
    return Number.isFinite(res) ? res : 0;
  }, [formData.quantity, formData.unit_cost]);

  // amount in AED
  const showAmounts = Number(formData.quantity) > 0 && Number(formData.unit_cost) > 0;
  const amountAED = useMemo(() => (
    showAmounts ? toAED(amount, formData.currency || "USD", rates) : 0
  ), [showAmounts, amount, formData.currency, rates]);

  const getIsPlan = (ed = {}) => typeof ed.is_plan === "boolean" ? ed.is_plan
    : typeof ed.cost_status === "string" ? ed.cost_status.toLowerCase() === "plan" : true;

  // form of Expense
  const formExpense = () => {
    if (!formData.description?.trim()) {
      alert("Cost description is required!");
      return null;
    }
  
    const quantity = parseInt(formData.quantity || 0, 10);
    const unit_cost_origin = parseFloat(formData.unit_cost || 0);
    const currency_origin = formData.currency || "USD";
    const amount_origin = quantity * unit_cost_origin;
    const amount_aed = toAED(amount_origin, currency_origin, rates);
    const mainWorker = workersList.find(w => w.id === formData.worker);
    if (!job_id) {
      alert("Job_id is required! ");
      return null;
    }

    const sale_id = formData.sale_id;

    if (!sale_id) {
      alert("Binded sale is required!");
      return null;
    }

    return {
      job_id: job_id,
      sale_id: sale_id,
      description: formData.description.trim(),
      quantity,
      unit_cost_origin,
      currency_origin: formData.currency || "USD",
      amount_origin,
      amount_aed,
      seller: formData.seller?.trim() || null,
      worker_id: formData.worker || null,
      worker_name: mainWorker?.name || null,
      date_to_seller_payment: formData.date_to_seller_payment || null,
      payment_note: formData.payment_note?.trim() || null,
      cost_status: isPlan ? "plan" : "fact",
      edit_date: new Date().toISOString(),
    };
  };
  

  useEffect(() => {
    if (isOpen) {
      API.get("/workers/")
        .then(res => setWorkersList(res.data))
        .catch(err => console.error("Error loading workers", err));
    }
  }, [isOpen]);


  useEffect(() => {
    if (!isOpen || !job_id) return;

    API.get(`/sales/by-job?job_id=${job_id}`)
      .then(res => {
        setSales(res.data || []);
      })
      .catch(err => {
        console.error("Error loading sales", err);
        setSales([]);
      });
  }, [isOpen, job_id]);


  // Загружаем данные при открытии
  useEffect(() => {
    if (!job_id) {
      console.error("AddExpenseModal opened without job_id");
      return;
    }
    setFormData({
      description: existingData.description ?? "",
      sale_id: existingData.sale_id ?? "",
      quantity: existingData.quantity ?? "",
      unit_cost: existingData.unit_cost_origin ?? "",
      currency: existingData.currency_origin ?? "USD",
      seller: existingData.seller ?? "",
      worker: existingData.worker_id ?? "",
      date_to_seller_payment: existingData.date_to_seller_payment ?? "",
      payment_note: existingData.payment_note ?? "",
    });

    setIsEdited(false);
    setIsPlan(getIsPlan(existingData));
  }, [existingData, isOpen, job_id]);

  // Отслеживание изменений
  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    setIsEdited(true);
  };

  // Сохранение
  const handleSave = async (e) => {
    e.preventDefault();

    const expenseData = formExpense();
    if(!expenseData) return;

    const payload = {
      job_id: expenseData.job_id,
      sale_id: expenseData.sale_id,
      cost_description: expenseData.description,
      quantity: expenseData.quantity,
      unit_cost_origin: expenseData.unit_cost_origin,
      currency_origin: expenseData.currency_origin,
      amount_origin: expenseData.amount_origin,
      amount_aed: expenseData.amount_aed,
      seller: expenseData.seller,
      worker_id: expenseData.worker_id,
      worker_name: expenseData.worker_name,
      date_to_seller_payment: expenseData.date_to_seller_payment || null
        ? new Date(expenseData.date_to_seller_payment)
        : null,
      payment_note: expenseData.payment_note,
      cost_status: expenseData.cost_status,
      edit_date: new Date(expenseData.edit_date),
      binded_sale: expenseData.sale_id,
    };

    console.log("Send expense to Expenses_collection: ", payload);

    try {
      const res = await API.post("/expenses", payload);
      if (onSave) onSave(res.data);
      setIsEdited(false);
      onClose();
    } catch (err) {
      console.error("Save expense error: ", err.response?.data || err.message);
      alert("Save expense error, check console")
    }
  };


  // Закрытие с проверкой изменений
  const handleClose = () => {
    if (isEdited) {
      if (confirm("Save changes before closing?")) {
        const expenseData = formExpense();
        if(!expenseData) return;
        onSave(expenseData);
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
            <div>Amount: {showAmounts ? format4(amount) : ""}</div>

            <select value={formData.currency || ""} onChange={(e) => handleChange("currency", e.target.value)}>
              <option value="">Currency</option>
              <option value="USD">USD</option>
              <option value="AED">AED</option>
              <option value="RUB">RUB</option>
              <option value="EUR">EUR</option>
            </select>

            <div>Cost amount in AED: {showAmounts ? format4(amountAED) : ""}</div>


            <input placeholder="Seller" value={formData.seller || ""} onChange={(e) => handleChange("seller", e.target.value)} />

            <select value={formData.worker || ""} onChange={(e) => handleChange("worker", e.target.value)}>
              <option value="">Choose worker</option>
              {workersList.map(w => (
                <option key={w.id || w._id} value={w.id || w._id}>{w.name}</option>
              ))}
            </select>

            {/* Binded Sale */}
            <select
              value={formData.sale_id ?? ""}
              onChange={(e) => handleChange("sale_id", e.target.value)}
            
            >
              <option value="">Binded Sale</option>
              {sales.map(s => (

                  <option key={s._id} value={s._id}>
                    {s.description}
                  </option>
                ))}
            </select>

            <input
              type={formData.date_to_seller_payment ? "date" : "text"}
              placeholder="Date of our payment to Seller"
              value={formData.date_to_seller_payment || ""}
              onFocus={(e) => (e.target.type = "date")}
              onBlur={(e) => { if (!e.target.value) e.target.type = "text"; }}
              onChange={(e) => handleChange("date_to_seller_payment", e.target.value)}
            />

            <textarea
              placeholder="Payment note"
              rows={2}
              value={formData.payment_note || ""}
              onChange={(e) => handleChange("payment_note", e.target.value)}
            />


          </div>

          <div className="modal-footer">
            <button type="submit" onClick={handleSave}>Save</button>
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
