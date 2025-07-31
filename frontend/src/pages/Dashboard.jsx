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
    <div className="flex w-full h-screen overflow-hidden">

      {/* Список работ */}
      <div className={`${selectedJob ? "w-3/4" : "w-full"} transition-all duration-300 overflow-y-auto`}>
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2">
              <button className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transform hover:scale-105 transition">
                <Plus size={16} /> Create
              </button>
              <button className="bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 transform hover:scale-105 transition">
                <Pencil size={16} /> Edit
              </button>
              <button className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transform hover:scale-105 transition">
                <Trash2 size={16} /> Delete
              </button>
              <button className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transform hover:scale-105 transition">
                <Eye size={16} /> Open
              </button>
            </div>

            <div className="flex gap-2 items-center">
              <input
                type="text"
                placeholder="Search by Job ID or Client"
                className="p-2 rounded bg-gray-700 text-white"
                value={searchTerm}
                onChange={handleSearch}
              />
              <button
                onClick={() => toggleSort("created_at")}
                className="text-white hover:text-gray-300 transform hover:scale-110 transition"
              >
                <ArrowUpDown size={18} />
              </button>
            </div>
          </div>

          {/* Таблица */}
          <table className="w-full table-fixed">
            <thead className="bg-gray-800 sticky top-0 z-10">
              <tr>
                <th className="p-2 text-left w-10">#</th>
                <th className="p-2 text-left">Job ID</th>
                <th className="p-2 text-left">Client</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Created At</th>
                <th className="p-2 text-left">Closed At</th>
                <th className="p-2 text-left">Delivery Date</th>
                <th className="p-2 text-left">Workers</th>
                <th className="p-2 text-left">Profit (USD)</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.slice(0, 20).map((job, index) => (
                <tr
                  key={job._id}
                  className="hover:bg-gray-700 cursor-pointer"
                  onClick={() => setSelectedJob(job)}
                >
                  <td className="p-2">{index + 1}</td>
                  <td className="p-2">{job.job_id}</td>
                  <td className="p-2">{job.main_part.client}</td>
                  <td className="p-2">{job.status}</td>
                  <td className="p-2">{job.created_at?.slice(0, 10)}</td>
                  <td className="p-2">{job.closed_at?.slice(0, 10) || "-"}</td>
                  <td className="p-2">{job.main_part.delivery_date || "-"}</td>
                  <td className="p-2 truncate">{job.workers?.map(w => w.name).join(", ")}</td>
                  <td className="p-2">{job.profit_total?.USD ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Панель деталей */}
      {selectedJob && (
        <div className="w-1/4 p-4 bg-gray-900 text-white overflow-y-auto h-screen">
          <h3 className="text-xl font-semibold mb-4">Job Details</h3>
          {Object.entries(selectedJob).map(([key, value]) => (
            <div key={key} className="mb-2 break-words whitespace-normal">
              <span className="font-semibold">{key}:</span>{" "}
              <span>{typeof value === "object" ? JSON.stringify(value) : value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}