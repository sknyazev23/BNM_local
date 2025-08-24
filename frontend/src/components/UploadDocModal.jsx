import { useState } from "react";
import API from "../api";

export default function UploadDocModal({ jobId, onClose, onDone }) {
  const [name, setName] = useState("");
  const [files, setFiles] = useState([]);

  const submit = async (e) => {
    e.preventDefault();
    if (!jobId) return;
    const fd = new FormData();
    fd.append("name", name.trim());
    for (const f of files) fd.append("files", f);
    await API.post(`/jobs/${jobId}/documents`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    onDone?.();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h4 className="text-lg mb-3">Add document</h4>
        <form onSubmit={submit}>
          <input
            placeholder="Document name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
          <input
            type="file"
            multiple
            onChange={e => setFiles([...e.target.files])}
            className="mt-2"
          />
          <div className="modal-actions">
            <button type="button" className="bn-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="bn-btn">Upload</button>
          </div>
        </form>
      </div>
    </div>
  );
}
