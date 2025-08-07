import React, { useState } from 'react';
import '../styles/modal.css';

export default function ClientAddModal({ onClose, onAddClient }) {
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [inn, setInn] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const handleSave = () => {
    if (!name.trim() || !contactPerson.trim()) {
      alert('Name and Contact Person are required');
      return;
    }

    const newClient = {
      name,
      contact_person: contactPerson,
      inn: inn || null,
      phone: phone || null,
      email: email || null,
    };

    onAddClient(newClient);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 className="modal-title">Add Client</h3>

        <div className="modal-grid">
          <input
            placeholder="Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            placeholder="Contact Person *"
            value={contactPerson}
            onChange={(e) => setContactPerson(e.target.value)}
          />
          <input
            placeholder="INN"
            value={inn}
            onChange={(e) => setInn(e.target.value)}
          />
          <input
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="modal-footer">
          <button onClick={handleSave}>Save</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
