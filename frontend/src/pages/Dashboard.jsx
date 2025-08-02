import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Eye, ArrowUpDown } from "lucide-react";
import API from "../api";
import "../styles/dashboard.css";

export default function Dashboard() {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("asc");

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    const res = await API.get("/jobs");
    setJobs(res.data);
    setFilteredJobs(res.data);
  };

  const toggleSort = (field) => {
    const order = sortBy === field && sortOrder === "asc" ? "desc" : "asc";
    const sorted = [...filteredJobs].sort((a, b) => {
      const aField = a[field];
      const bField = b[field];
      if (order === "asc") return aField > bField ? 1 : -1;
      return aField < bField ? 1 : -1;
    });
    setSortBy(field);
    setSortOrder(order);
    setFilteredJobs(sorted);
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);

    const filtered = jobs.filter((job) => {
      const jobId = job.job_id?.toLowerCase() || "";
      const client = job.main_part?.client?.toLowerCase() || "";
      const status = job.status?.toLowerCase() || "";
      return (
        jobId.includes(term) ||
        client.includes(term) ||
        status.includes(term)
      );
    });

    setFilteredJobs(filtered);
  };

  return (
    <div className="dashboard">
      {/* Список работ */}
      <div className={`job-list ${selectedJob ? "narrow" : ""}`}>
        <div className="job-controls">
          <div className="job-buttons">
            <button className="create">
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
          </div>

          <div className="search-section">
            <input
              type="text"
              placeholder="Search by Job ID or Client"
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
              <th>Job ID</th>
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
            {filteredJobs.slice(0, 20).map((job, index) => (
              <tr
                key={job._id}
                onClick={() => setSelectedJob(job)}
              >
                <td>{index + 1}</td>
                <td>{job.job_id}</td>
                <td>{job.main_part.client}</td>
                <td>{job.status}</td>
                <td>{job.created_at?.slice(0, 10)}</td>
                <td>{job.closed_at?.slice(0, 10) || "-"}</td>
                <td>{job.main_part.delivery_date || "-"}</td>
                <td>{job.workers?.map(w => w.name).join(", ")}</td>
                <td>{job.profit_total?.USD ?? "-"}</td>
              </tr>
            ))}
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
              <span>{typeof value === "object" ? JSON.stringify(value) : value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}