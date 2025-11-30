import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Eye, ArrowUpDown, UserPlus } from "lucide-react";
import API from "../api";
import "../styles/dashboard.css";
import "../styles/modal.css";
import ModalAddWorker from "../components/ModalAddWorker";

export default function Dashboard() {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showWorkerModal, setShowWorkerModal] = useState(false);

  const navigate = useNavigate();
  const navigateToClients = () => navigate("/clients");

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    const res = await API.get("/jobs/");
    setJobs(res.data || []);
    setFilteredJobs(res.data || []);
  };

  // форматирование дат из БД
  const fmtDate = (d) => {
    if (!d) return "—";
    const raw = typeof d === "string" ? d : d?.$date ?? d;
    const s = String(raw);
    if (s.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    const dt = new Date(raw);
    return isNaN(+dt) ? "—" : dt.toISOString().slice(0, 10);
  };

  // сортировка по плоским полям
  const toggleSort = (field) => {
    const order = sortBy === field && sortOrder === "asc" ? "desc" : "asc";
    const getter = (row) => {
      if (field === "created_at")  return row.created_at  || "";
      if (field === "bn_number")   return row.bn_number   || "";
      if (field === "client_name") return row.client_name || "";
      if (field === "status")      return row.archived ? "archived" : "open";
      return row[field] ?? "";
    };
    const sorted = [...filteredJobs].sort((a, b) => {
      const av = getter(a);
      const bv = getter(b);
      if (order === "asc") return av > bv ? 1 : av < bv ? -1 : 0;
      return av < bv ? 1 : av > bv ? -1 : 0;
    });
    setSortBy(field);
    setSortOrder(order);
    setFilteredJobs(sorted);
  };

  // поиск по bn_number / client_name / status
  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    const filtered = (jobs || []).filter((job) => {
      const bn     = (job.bn_number   || "").toLowerCase();
      const client = (job.client_name || "").toLowerCase();
      const status = job.archived ? "archived" : "open";
      return bn.includes(term) || client.includes(term) || status.includes(term);
    });
    setFilteredJobs(filtered);
  };

  const handleAddWorker = async () => {
    // после добавления — просто закрываем модалку, данные в таблице берём из jobs
    setShowWorkerModal(false);
  };

  return (
    <div className="dashboard">
      {/* Список работ */}
      <div className={`job-list ${selectedJob ? "narrow" : ""}`}>
        <div className="job-controls">
          <div className="job-buttons">
            <button type="button" className="create" onClick={() => navigate("/job/new")}>
              <Plus size={16} /> Create
            </button>
            <button className="edit">
              <Pencil size={16} /> Edit
            </button>
            <button className="delete">
              <Trash2 size={16} /> Delete
            </button>
            <button className="open">
              <Eye size={16} /> Open
            </button>
            <button onClick={navigateToClients}>Clients</button>
            <button className="add-worker" onClick={() => setShowWorkerModal(true)}>
              <UserPlus size={16} /> Add Worker
            </button>
          </div>

          <div className="search-section">
            <input
              type="text"
              placeholder="Search by BN number or Client"
              value={searchTerm}
              onChange={handleSearch}
            />
            <button onClick={() => toggleSort("created_at")}>
              <ArrowUpDown size={18} />
            </button>
          </div>
        </div>

        {/* Таблица */}
        <table className="job-table">
          <thead>
            <tr>
              <th>#</th>
              <th>BN number</th>
              <th>Client</th>
              <th>Status</th>
              <th>Created At</th>
              <th>Closed At</th>
              <th>Delivery Date</th>
              <th>Workers</th>
              <th>Profit (USD)</th>
            </tr>
          </thead>
          <tbody>
            {filteredJobs.slice(0, 20).map((job, index) => {
              const jobId = job.id || job._id || String(index);
              const workers = Array.isArray(job.workers) ? job.workers : [];
              const profitNum = Number(job.profit_usd);
              const profitText = Number.isFinite(profitNum) ? profitNum.toLocaleString() : "—";

              return (
                <tr
                  key={jobId}
                  onClick={() => setSelectedJob(job)}
                  onDoubleClick={() => navigate(`/job/${jobId}`)}
                >
                  <td>{index + 1}</td>
                  <td>{job.bn_number || "—"}</td>
                  <td>{job.client_name || "—"}</td>
                  <td>{job.archived ? "Archived" : "Open"}</td>
                  <td>{fmtDate(job.created_at)}</td>
                  <td>{fmtDate(job.closed_at)}</td>
                  <td>{fmtDate(job.serviceDate || job.delivery_date)}</td>
                  <td className="col-workers">
                    {workers.length
                      ? workers.map((name, wi) => (
                          <div key={`${jobId}-w-${wi}`}>{name}</div>
                        ))
                      : "—"}
                  </td>
                  <td>{profitText}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Панель деталей */}
      {selectedJob && (
        <div className="job-details">
          <h3>Job Details</h3>
          {Object.entries(selectedJob).map(([key, value]) => (
            <div key={key}>
              <span className="label">{key}:</span>{" "}
              <span>{typeof value === "object" ? JSON.stringify(value) : String(value)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Модалка добавления работника */}
      {showWorkerModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <ModalAddWorker onClose={() => setShowWorkerModal(false)} onAddWorker={handleAddWorker} />
          </div>
        </div>
      )}
    </div>
  );
}
