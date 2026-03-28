import React, { useState } from "react";
import useDraggableModal from "../hooks/useDraggableModal";
import API from "../api";
import "../styles/modal.css";

export default function ModalAddWorker({ onClose, onAddWorker }) {
  const { overlayProps, panelProps } = useDraggableModal();
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [field, setField] = useState("");
  const [mail, setMail] = useState("");
  const [percent, setPercent] = useState("");

  const handleSave = async () => {
    if (!name.trim()) {
      alert("Name is required");
      return;
    }
    const newWorker = {
      name: name.trim(),
      field: field || null,
      role: role || null,
      mail: mail || null,
      percent_rate: percent ? parseFloat(percent) : null,
    };
    try {
      await API.post("/workers/", newWorker);
      onAddWorker(newWorker);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error adding worker");
    }
  };

  return (
    <div className="modal-overlay" {...overlayProps}>
      <div className="modal-content" {...panelProps}>
        <h3 className="modal-title">Add Worker</h3>

        <div className="modal-grid" style={{ gridTemplateColumns: "1fr" }}>
          <input
            placeholder="Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            placeholder="Role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
          <input
            placeholder="Field"
            value={field}
            onChange={(e) => setField(e.target.value)}
          />
          <input
            placeholder="E-mail"
            value={mail}
            onChange={(e) => setMail(e.target.value)}
          />
          <input
            placeholder="Percent rate"
            type="number"
            value={percent}
            onChange={(e) => setPercent(e.target.value)}
          />
        </div>

        <div className="modal-footer">
          <button type="button" onClick={handleSave}>Save</button>
          <button type="button" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
