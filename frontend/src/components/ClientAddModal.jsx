import React, { useState } from 'react';
import '../styles/modal.css';

export default function ClientAddModal({ onClose, onAddClient }) {
  const [name, setName] = useState('');
  const [vat, setVat] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');
  const [note, setNote] = useState('');

  const handleSave = () => {
    if (!name.trim() || !contactPerson.trim()) {
      alert('Name and Contact Person are required');
      return;
    }

    const newClient = {
      name,
      vat: vat || null,
      contact_person: contactPerson,
      phone: phone || null,
      email: email || null,
      country: country || null,
      note: note || null,
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
            placeholder="VAT"
            value={vat}
            onChange={(e) => setVat(e.target.value)}
          />
          <input
            placeholder="Contact Person"
            value={contactPerson}
            onChange={(e) => setContactPerson(e.target.value)}
          />
          
          <input
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <input
            placeholder="e_Mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            placeholder="Country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          />
          <input
            placeholder="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
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
