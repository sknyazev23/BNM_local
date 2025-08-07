import React, { useState } from "react";
import "../styles/modal.css";

export default function AddSaleModal({ onAdd, onClose, workers }) {
  const [description, setDescription] = useState("");
  const [costUSD, setCostUSD] = useState("");
  const [worker, setWorker] = useState("");

  const handleAdd = () => {
    if (!description || !costUSD) return;
    const sale = {
      description,
      cost: {
        USD: parseFloat(costUSD),
      },
      worker,
    };
    onAdd(sale);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 className="modal-title">Add Sale</h3>
        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          type="number"
          placeholder="Sale (USD)"
          value={costUSD}
          onChange={(e) => setCostUSD(e.target.value)}
        />
        <select
          value={worker}
          onChange={(e) => setWorker(e.target.value)}
        >
          <option value="">Choose worker</option>
          {workers.map((w) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>

        <div className="modal-footer">
          <button onClick={handleAdd}>Add</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
