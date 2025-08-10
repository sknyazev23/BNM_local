import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Trash2, Plus } from "lucide-react";
import EditClientModal from "../components/EditClientModal";
import ClientAddModal from "../components/ClientAddModal";
import { exportClientsToExcel } from "../utils/exportClientsExcel";
import "../styles/clients.css";
import API from "../api";

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);


  const navigate = useNavigate();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    const res = await API.get("/clients");
    setClients(res.data);
  };

  const handleExportExcel = () => exportClientsToExcel(clients);

    // универсальный UPDATE с fallback'ами
  const updateClient = async (id, payload) => {
    const tries = [
      { m: "patch", url: `/clients/${id}/` },
      { m: "patch", url: `/clients/${id}` },
      { m: "put",   url: `/clients/${id}/` },
      { m: "put",   url: `/clients/${id}` },
      { m: "post",  url: `/clients/${id}/update/` },
      { m: "post",  url: `/clients/update/${id}/` },
    ];
    let lastErr;
    for (const t of tries) {
      try {
        return await API[t.m](t.url, payload);
      } catch (e) {
        lastErr = e;
        const code = e?.response?.status;
        if (code !== 404 && code !== 405) throw e;
      }
    }
    throw lastErr;
  };

  // универсальный DELETE с fallback'ами
  const removeClient = async (id) => {
    const tries = [
      { fn: () => API.delete(`/clients/${id}/`) },
      { fn: () => API.delete(`/clients/${id}`) },
      { fn: () => API.post(`/clients/${id}/delete/`) },
      { fn: () => API.post(`/clients/delete/${id}/`) },
      { fn: () => API.delete(`/clients/`, { params: { id } }) },
    ];
    let lastErr;
    for (const t of tries) {
      try {
        return await t.fn();
      } catch (e) {
        lastErr = e;
        const code = e?.response?.status;
        if (code !== 404 && code !== 405) throw e;
      }
    }
    throw lastErr;
  };

  const handleCreateClient = async (payload) => {
    try {
      await API.post("/clients/", payload);
      await fetchClients();
      setShowAddModal(false);
    } catch (e) {
      console.error("Create error: ", e);
      alert("Create was failure");
    }
  };

  const handleUpdateClient = async (payload) => {
    if (!editClient?._id) return;
    try {
      await updateClient(editClient._id, payload);
      await fetchClients();
      setShowEditModal(false);
      setEditClient(null);
    } catch (e) {
      console.error("Update error: ", e?.response?.status, e?.response?.data || e);
      alert(`Not updated (code: ${e?.response?.status ?? "?"}).`);
    }
  };

  const handleDelete = async (id) => {
    const ok = window.confirm("Delete this client?");
    if (!ok) return;
    try {
      await removeClient(id);
      await fetchClients();
    } catch (e) {
      console.error("Delete error: ", e?.response?.status, e?.response?.data || e);
      alert(`Delete failed (code: ${e?.response?.status ?? "?"}).`);
    }
  };

  const cell = (v) =>
  v === null || v === undefined || String(v).trim() === "" ? " " : v;


  return (
    <div className="clients-page-wrapper">
      <div className="clients-fixed-header">
        
        <div className="clients-actions">
          <button className="buttons" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Add New Client
          </button>

          <button className="buttons" onClick={handleExportExcel}>
            Export to Excel
          </button>

          <button className="buttons" onClick={() => navigate("/dashboard")}>Close</button>
        </div>
        <h2 className="clients-title">Clients</h2>
      </div>

      <div className="clients-table">

        <div className="clients-table-header">
          <span>#</span>
          <span>Name</span>
          <span>VAT</span>
          <span>Contact person</span>
          <span>Phone</span>
          <span>e_Mail</span>
          <span>Country</span>
          <span>Note</span>
          <span>Actions</span>
        </div>

        <div className="clients-table-body">
        {clients.map((client, index) => (
          <div className="client-row" key={client._id}>
            <span className="c-idx">{index + 1}</span>
            <span className="c-name">{cell(client.name)}</span>
            <span className="c-vat">{cell(client.vat_number)}</span>
            <span className="c-contact">{cell(client.contact_person)}</span>
            <span className="c-phone">{cell(client.phone)}</span>
            <span className="c-mail">{cell(client.mail)}</span>
            <span className="c-country">{cell(client.country)}</span>
            <span className="c-note">{cell(client.note)}</span>

            <div className="c-actions">
              <button className="icon-btn" aria-label="Edit"
              onClick={() => { setEditClient(client); setShowEditModal(true); }}>
                <Pencil />
              </button>

              <button className="icon-btn" aria-label="Delete"
              onClick={() => handleDelete(client._id)}>
                <Trash2 /></button>
            </div>
          </div>
        ))}
        </div>
      </div>


      {showAddModal && (
        <ClientAddModal
          onAddClient={handleCreateClient}
          onClose={() => setShowAddModal(false)}
          />
      )}

      {showEditModal && editClient && (
        <EditClientModal
          initialClient={editClient}
          onSave={handleUpdateClient}
          onClose={() => { setShowEditModal(false); setEditClient(null); }}
        />
      )}
      <div className="clients-total">
        Total in db: {clients.length} clients
      </div>

    </div>
  );
}
