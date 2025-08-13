import { useState, useEffect, useMemo } from "react";
import API from "../api";
import "../styles/modal.css";

export default function AddExpenseModal({ isOpen, onClose, onSave, existingData = {}, workers }) {
  const [formData, setFormData] = useState({});
  const [isEdited, setIsEdited] = useState(false);
  const [workersList, setWorkersList] = useState([]);

  // пересчет для Amount
  const amount = useMemo(() => {
    const q = parseFloat(formData.quantity) || 0;
    const u = parseFloat(formData.unit_cost) || 0;
    const res = q*u;
    return Number.isFinite(res) ? res : 0;
  }, [formData.quantity, formData.unit_cost]);


  useEffect(() => {
    if (isOpen) {
      API.get("/workers/")
        .then(res => setWorkersList(res.data))
        .catch(err => console.error("Error loading workers", err));
    }
  }, [isOpen]);

  // Загружаем данные при открытии
  useEffect(() => {
    setFormData(existingData || {});
    setIsEdited(false);
  }, [existingData, isOpen]);

  // Отслеживание изменений
  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    setIsEdited(true);
  };

  // Сохранение
  const handleSave = (e) => {
    e.preventDefault();
    onSave({ ...formData, amount });
    setIsEdited(false);
  };

  // Закрытие с проверкой изменений
  const handleClose = () => {
    if (isEdited) {
      if (confirm("Save changes before closing?")) {
        onSave({ ...formData, amount });
      }
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 className="modal-title">Add Expense</h3>

        <form onSubmit={handleSave}>
          <div className="modal-grid">
            <input placeholder="№" value={formData.no || ""} onChange={(e) => handleChange("no", e.target.value)} />
            <input placeholder="Cost description" value={formData.description || ""} onChange={(e) => handleChange("description", e.target.value)} />
            <input placeholder="Quantity" type="number" value={formData.quantity || ""} onChange={(e) => handleChange("quantity", parseFloat(e.target.value) || 0)} />
            <input placeholder="Cost per unit" type="number" value={formData.unit_cost || ""} onChange={(e) => handleChange("unit_cost", parseFloat(e.target.value) || 0)} />
            <input placeholder="Amount" type="text" value={amount.toFixed(4)} readOnly />

            <select value={formData.currency || ""} onChange={(e) => handleChange("currency", e.target.value)}>
              <option value="">Currency</option>
              <option value="USD">USD</option>
              <option value="AED">AED</option>
              <option value="RUB">RUB</option>
              <option value="EUR">EUR</option>
            </select>

            <input placeholder="Seller" value={formData.seller || ""} onChange={(e) => handleChange("seller", e.target.value)} />

            <select value={formData.worker || ""} onChange={(e) => handleChange("worker", e.target.value)}>
              <option value="">Choose worker</option>
              {workersList.map(w => (
                <option key={w.id || w._id} value={w.id || w._id}>{w.name}</option>
              ))}
            </select>
          </div>

          <div className="modal-footer">
            <button onClick={handleSave}>Save</button>
            <button type="button" onClick={handleClose}>Close</button>
          </div>
        </form>

        <div className="modal-date">
          {new Date().toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "long",
            year: "numeric"
          })}
        </div>
      </div>
    </div>
  );
}
