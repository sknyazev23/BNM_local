import { useState, useEffect } from "react";
import "../styles/modal.css";

export default function AddSaleModal({ onClose, onSave, workers, existingSale }) {
  const [saleData, setSaleData] = useState({
    number: "",
    description: "",
    quantity: 0,
    costPerUnit: 0,
    amount: 0,
    currency: "USD",
    amountAED: 0,
    worker: ""
  });

  const [originalData, setOriginalData] = useState(null);
  const [modified, setModified] = useState(false);

  useEffect(() => {
    if (existingSale) {
      setSaleData(existingSale);
      setOriginalData(existingSale);
    }
  }, [existingSale]);

  const handleChange = (field, value) => {
    setSaleData(prev => {
      const updated = { ...prev, [field]: value };
      if (JSON.stringify(updated) !== JSON.stringify(originalData)) {
        setModified(true);
      }
      return updated;
    });
  };

  const handleSave = () => {
    onSave(saleData);
    alert("Data saved.");
    setModified(false);
  };

  const handleClose = () => {
    if (modified) {
      if (confirm("Save changes?")) {
        handleSave();
      }
    }
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 className="modal-title">Add Salee</h3>

        <div className="modal-grid">
          <input placeholder="№" value={saleData.number} onChange={e => handleChange("number", e.target.value)} />
          <input placeholder="Sale description" value={saleData.description} onChange={e => handleChange("description", e.target.value)} />
          <input type="number" placeholder="Quantity" value={saleData.quantity} onChange={e => handleChange("quantity", parseInt(e.target.value))} />
          <input type="number" placeholder="Cost per unit" value={saleData.costPerUnit} onChange={e => handleChange("costPerUnit", parseFloat(e.target.value))} />
          <input type="number" placeholder="Amount" value={saleData.amount} onChange={e => handleChange("amount", parseFloat(e.target.value))} />
          <select value={saleData.currency} onChange={e => handleChange("currency", e.target.value)}>
            <option value="USD">USD</option>
            <option value="AED">AED</option>
            <option value="RUB">RUB</option>
            <option value="EUR">EUR</option>
          </select>
          <input type="number" placeholder="Amount in AED" value={saleData.amountAED} onChange={e => handleChange("amountAED", parseFloat(e.target.value))} />
          <select value={saleData.worker} onChange={e => handleChange("worker", e.target.value)}>
            <option value="">Choose worker</option>
            {workers.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>

        <div className="modal-footer">
          <button onClick={handleSave}>Save</button>
          <button onClick={() => alert("Edit mode coming soon")}>Edit</button>
          <button onClick={() => alert("Delete logic coming soon")}>Delete</button>
          <button onClick={handleClose}>Close</button>
        </div>

        <div className="modal-date">
          {new Date().toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" })}
        </div>
      </div>
    </div>
  );
}
