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
  const [selectedIds, setSelectedIds] = useState(new Set());
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

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredJobs.length) {
      setSelectedIds(new Set());
    } else {
      const allIds = filteredJobs.map(j => j._id || j.id);
      setSelectedIds(new Set(allIds));
    }
  };

  const toggleSelectJob = (id, e) => {
    e.stopPropagation(); // Don't trigger row click
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;

    const confirmMsg = selectedIds.size === 1
      ? "Are you sure you want to delete this job?"
      : `Are you sure you want to delete ${selectedIds.size} selected jobs? All associated sales, expenses and documents will be permanently removed.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await API.post("/jobs/bulk-delete", Array.from(selectedIds));
      setSelectedIds(new Set());
      fetchJobs();
    } catch (err) {
      console.error("Delete failed", err);
      alert("Failed to delete selected jobs.");
    }
  };

  const fmtDate = (d) => {
    if (!d) return "—";
    const raw = typeof d === "string" ? d : d?.$date ?? d;
    const s = String(raw);
    let iso = "";
    if (s.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(s)) {
      iso = s.slice(0, 10);
    } else {
      const dt = new Date(raw);
      if (isNaN(+dt)) return "—";
      iso = dt.toISOString().slice(0, 10);
    }
    const [yyyy, mm, dd] = iso.split("-");
    return `${dd}-${mm}-${yyyy}`;
  };

  // сортировка по плоским полям
  const toggleSort = (field) => {
    const order = sortBy === field && sortOrder === "asc" ? "desc" : "asc";
    const getter = (row) => {
      if (field === "created_at") return row.created_at || "";
      if (field === "bn_number") return row.bn_number || "";
      if (field === "client_name") return row.client_name || "";
      if (field === "status") return row.archived ? "archived" : "open";
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
      const bn = (job.bn_number || "").toLowerCase();
      const client = (job.client_name || "").toLowerCase();
      const status = job.archived ? "archived" : "open";
      return bn.includes(term) || client.includes(term) || status.includes(term);
    });
    setFilteredJobs(filtered);
    setSelectedIds(new Set()); // Clear selection when filtering
  };

  const handleAddWorker = async () => {
    // после добавления — просто закрываем модалку, данные в таблице берём из jobs
    setShowWorkerModal(false);
  };

  return (
    <div className="dashboard">
      {/* Список работ */}
      <div className="job-list">
        <div className="job-controls">
          <div className="job-buttons">

            <button type="button" className="create"
              onClick={async () => {
                try {
                  const res = await API.get("/jobs/generate-id");
                  if (res.data && res.data.job_id) {
                    navigate(`/job/${res.data.job_id}`);
                  }
                } catch (err) {
                  console.error("Failed to generate job ID", err);
                  alert("Failed to create new job. See console for details.");
                }
              }}
            >
              <Plus size={16} /> Create
            </button>

            <button className="clients-btn" onClick={navigateToClients}>Clients</button>

            <button className="add-worker" onClick={() => setShowWorkerModal(true)}>
              <UserPlus size={16} /> Add Worker
            </button>

            <button
              className="delete"
              onClick={handleDeleteSelected}
              disabled={selectedIds.size === 0}
              style={{ opacity: selectedIds.size === 0 ? 0.5 : 1 }}
            >
              <Trash2 size={16} /> Delete {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
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

        <div className="dashboard-table">
          <div className="dashboard-table-header">
            <span>
              <input
                type="checkbox"
                checked={filteredJobs.length > 0 && selectedIds.size === filteredJobs.length}
                onChange={toggleSelectAll}
              />
            </span>
            <span>#</span>
            <span>BN number</span>
            <span>Client</span>
            <span>Status</span>
            <span>Created At</span>
            <span>Closed At</span>
            <span>Service Done</span>
            <span>Workers</span>
            <span>Profit (USD)</span>
          </div>
          <div className="dashboard-table-body">
            {filteredJobs.slice(0, 20).map((job, index) => {
              const jobId = job._id || job.id;
              const isSelected = selectedIds.has(jobId);
              const workers = Array.isArray(job.workers) ? job.workers : [];
              const profitNum = Number(job.profit_usd);
              const profitText = Number.isFinite(profitNum) ? profitNum.toLocaleString() : "—";

              return (
                <div
                  className={`dashboard-row ${isSelected ? "selected" : ""}`}
                  key={jobId}
                  onClick={() => setSelectedJob(job)}
                  onDoubleClick={() => navigate(`/job/${jobId}`)}
                >
                  <span>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => toggleSelectJob(jobId, e)}
                    />
                  </span>
                  <span>{index + 1}</span>
                  <span>{job.bn_number || "—"}</span>
                  <span>{job.client_name || "—"}</span>
                  <span>{job.archived ? "Archived" : "Open"}</span>
                  <span>{fmtDate(job.created_at)}</span>
                  <span>{fmtDate(job.closed_at)}</span>
                  <span>{fmtDate(job.serviceDone || job.delivery_date || job.serviceDate)}</span>
                  <span className="col-workers">
                    {workers.length
                      ? workers.map((name, wi) => (
                        <div key={`${jobId}-w-${wi}`}>{name}</div>
                      ))
                      : "—"}
                  </span>
                  <span>{profitText}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>



      {/* Модалка добавления работника */}
      {showWorkerModal && (
        <ModalAddWorker onClose={() => setShowWorkerModal(false)} onAddWorker={handleAddWorker} />
      )}
    </div>
  );
}
