import { useState } from "react";
import useDraggableModal from "../hooks/useDraggableModal";
import API from "../api";
import "../styles/modal.css";

export default function UploadDocModal({ jobId, onClose, onDone }) {
  const { overlayProps, panelProps } = useDraggableModal();
  const [name, setName] = useState("");
  // ... (rest of simple state)
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Document name is required");
      return;
    }
    if (files.length === 0) {
      setError("Please select at least one file");
      return;
    }
    if (!jobId) {
      setError("No Job ID — save the job first");
      return;
    }

    try {
      setIsLoading(true);
      const fd = new FormData();
      fd.append("name", name.trim());
      for (const f of files) fd.append("files", f);

      await API.post(`/jobs/${jobId}/documents`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onDone?.();
    } catch (err) {
      console.error("Upload error:", err);
      setError(err?.response?.data?.detail || err.message || "Upload failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" {...overlayProps}>
      <div className="modal-content" {...panelProps}>
        <div className="modal-no"># doc</div>
        <h3 className="modal-title">Add Document</h3>

        <form onSubmit={handleSubmit}>
          <div className="modal-grid">
            {/* Document name */}
            <div className="floating-input-group" style={{ gridColumn: "1 / -1" }}>
              <input
                placeholder=" "
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <label>Document name / label</label>
              <fieldset aria-hidden="true"><legend><span>Document name / label</span></legend></fieldset>
            </div>

            {/* File picker */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "13px",
                color: "#888"
              }}>
                Select files
              </label>
              <input
                type="file"
                multiple
                onChange={(e) => setFiles([...e.target.files])}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "10px 14px",
                  background: "transparent",
                  border: "1px solid #555",
                  borderRadius: "8px",
                  color: "#ccc",
                  fontSize: "14px",
                  cursor: "pointer",
                  boxSizing: "border-box",
                }}
              />
              {files.length > 0 && (
                <div style={{ marginTop: "8px", fontSize: "13px", color: "#2dd4bf" }}>
                  {files.length} file{files.length !== 1 ? "s" : ""} selected:{" "}
                  {files.map(f => f.name).join(", ")}
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div style={{
                gridColumn: "1 / -1",
                color: "#f87171",
                fontSize: "13px",
                padding: "6px 0",
              }}>
                ⚠ {error}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="submit" disabled={isLoading}>
              {isLoading ? "Uploading…" : "Upload"}
            </button>
            <button type="button" onClick={onClose} disabled={isLoading}>
              Cancel
            </button>
          </div>
        </form>

        <div className="modal-date">
          <div className="date-text">
            {new Date().toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
