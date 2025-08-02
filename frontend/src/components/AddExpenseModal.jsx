import { useState, useEffect } from "react";
import "../styles/modal.css";

export default function AddExpenseModal({ isOpen, onClose, onSave, existingData = {}, workers }) {
  const [formData, setFormData] = useState({});
  const [isEdited, setIsEdited] = useState(false);

  useEffect(() => {
    if (isOpen && existingData) {
      setFormData(existingData);
      setIsEdited(false);
    }
  }, [isOpen]);


  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsEdited(true);
  };

  const handleSave = () => {
    onSave(formData);
    setIsEdited(false);
    alert("Data saved");
  };

  const handleClose = () => {
    if (isEdited) {
      if (confirm("Save changes?")) {
        handleSave();
      } else {
        onClose();
      }
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 className="modal-title">Add Expense</h3>

        <div className="modal-grid">
          <input placeholder="№" value={formData.no || ""} onChange={(e) => handleChange("no", e.target.value)} />
          <input placeholder="Cost description" value={formData.description || ""} onChange={(e) => handleChange("description", e.target.value)} />
          <input placeholder="Quantity" type="number" value={formData.quantity || ""} onChange={(e) => handleChange("quantity", parseInt(e.target.value))} />
          <input placeholder="Cost per unit" type="number" value={formData.unit_cost || ""} onChange={(e) => handleChange("unit_cost", parseFloat(e.target.value))} />
          <input placeholder="Amount" type="number" value={formData.amount || ""} onChange={(e) => handleChange("amount", parseFloat(e.target.value))} />
          
          <select value={formData.currency || ""} onChange={(e) => handleChange("currency", e.target.value)}>
            <option value="">Currency</option>
            <option value="USD">USD</option>
            <option value="AED">AED</option>
            <option value="RUB">RUB</option>
            <option value="EUR">EUR</option>
          </select>

          <input placeholder="Amount in AED" type="number" value={formData.amount_aed || ""} onChange={(e) => handleChange("amount_aed", parseFloat(e.target.value))} />
          <input placeholder="Seller" value={formData.seller || ""} onChange={(e) => handleChange("seller", e.target.value)} />
          
          <select value={formData.worker || ""} onChange={(e) => handleChange("worker", e.target.value)}>
            <option value="">Choose worker</option>
            {workers.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>

        <div className="modal-footer">
          <button onClick={handleSave}>Save</button>
          <button onClick={() => alert("Edit mode: not implemented")}>Edit</button>
          <button onClick={() => alert("Delete mode: not implemented")}>Delete</button>
          <button onClick={handleClose}>Close</button>
        </div>

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