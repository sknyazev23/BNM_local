import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Trash2, Plus } from "lucide-react";
import "../styles/clients.css";
import API from "../api";

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newClient, setNewClient] = useState({
    name: "",
    vat_number: "",
    phone: "",
    mail: "",
    contact_person: "",
    country: "",
    note: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    const res = await API.get("/clients");
    setClients(res.data);
  };

  const handleAddClient = async () => {
    try {
      const { data: created } = await API.post("/clients/", newClient);

      await fetchClients();
  
      setShowModal(false);
      navigate("/clients");
    } catch (error) {
      console.error("Error adding new client: ", error);
    }
  };

  return (
    <div className="clients-page-wrapper">
      <div className="clients-fixed-header">
        
        <div className="clients-actions">
          <button className="buttons" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Add New Client
          </button>
          <button className="buttons" onClick={() => navigate("/dashboard")}>Close</button>
        </div>
        <h2 className="clients-title">Clients</h2>
      </div>

      <div className="clients-table-header">
        <span>#</span>
        <span>Name</span>
        <span>Contact Person</span>
        <span>Phone</span>
        <span>Email</span>
        <span>VAT</span>
        <span>Country</span>
        <span>Note</span>
        <span>Actions</span>
      </div>

      <div className="clients-table-body">
        {clients.map((client, index) => (
          <div className="client-row" key={client._id}>
            <span>{index + 1}</span>
            <span>{client.name}</span>
            <span>{client.vat_number}</span>
            <span>{client.contact_person}</span>
            <span>{client.phone}</span>
            <span>{client.mail}</span>
            <span>{client.country}</span>
            <span>{client.note}</span>
            <span className="client-actions">
              <button className="icon-btn"><Pencil size={14} /></button>
              <button className="icon-btn"><Trash2 size={14} /></button>
            </span>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Add New Client</h3>
            <div className="modal-grid">
              {Object.keys(newClient)
              .map((key) => (
                <input
                  key={key}
                  placeholder={key.toUpperCase()}
                  value={newClient[key] ?? ""}
                  onChange={(e) => setNewClient({ ...newClient, [key]: e.target.value })}
                />
              ))}
            </div>
            <div className="modal-footer">
              <button onClick={handleAddClient}>Save</button>
              <button onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
