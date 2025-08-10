import React, { useEffect, useRef, useState } from "react";
import "../styles/modal.css";

export default function EditClientModal({ initialClient, onSave, onClose }) {
  const [name, setName] = useState("");
  const [vat, setVat] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [mail, setMail] = useState("");
  const [country, setCountry] = useState("");
  const [note, setNote] = useState("");

  // снимок исходных значений для проверки "грязности"
  const snapshotRef = useRef({
    name: "", vat: "", contactPerson: "", phone: "", mail: "", country: "", note: ""
  });

  useEffect(() => {
    if (!initialClient) return;

    const preset = {
      name: initialClient.name ?? "",
      vat: initialClient.vat_number ?? initialClient.inn ?? "",
      contactPerson: initialClient.contact_person ?? "",
      phone: initialClient.phone ?? "",
      mail: initialClient.mail ?? initialClient.email ?? "",
      country: initialClient.country ?? "",
      note: initialClient.note ?? "",
    };

    setName(preset.name);
    setVat(preset.vat);
    setContactPerson(preset.contactPerson);
    setPhone(preset.phone);
    setMail(preset.mail);
    setCountry(preset.country);
    setNote(preset.note);

    snapshotRef.current = preset; // сохранили исходник для сравнения
  }, [initialClient]);

  const handleSave = async () => {
    if (!name.trim() || !contactPerson.trim()) {
      alert("Name and Contact Person are required");
      return;
    }

    const payload = {
      name,
      vat_number: vat || null,
      contact_person: contactPerson,
      phone: phone || null,
      mail: mail || null,
      country: country || null,
      note: note || null,
    };

    // сравниваем с исходником
    const s = snapshotRef.current;
    const isDirty =
      (name ?? "") !== (s.name ?? "") ||
      (vat ?? "") !== (s.vat ?? "") ||
      (contactPerson ?? "") !== (s.contactPerson ?? "") ||
      (phone ?? "") !== (s.phone ?? "") ||
      (mail ?? "") !== (s.mail ?? "") ||
      (country ?? "") !== (s.country ?? "") ||
      (note ?? "") !== (s.note ?? "");

    if (!isDirty) {
      onClose?.();
      return;
    }

    const ok = window.confirm("Сохранить изменения?");
    if (!ok) {
      onClose?.();
      return;
    }

    await onSave?.(payload);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 className="modal-title">Edit Client</h3>

        <div className="modal-grid">
          <input
            placeholder="Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            placeholder="VAT / INN"
            value={vat}
            onChange={(e) => setVat(e.target.value)}
          />
          <input
            placeholder="Contact Person *"
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
            value={mail}
            onChange={(e) => setMail(e.target.value)}
          />
          <input
            placeholder="Country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          />
          <input
            placeholder="Note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div className="modal-footer">
          <button onClick={handleSave}>Save changes & close</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
