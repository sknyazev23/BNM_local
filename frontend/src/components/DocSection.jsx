import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import API from "../api";
import UploadDocModal from "./UploadDocModal";

export default function DocSection({ jobId }) {
  const [docs, setDocs] = useState([]);
  const [open, setOpen] = useState(false);

  const load = async () => {
    if (!jobId) return;
    const { data } = await API.get(`/jobs/${jobId}/documents`);
    // ожидаем массив вида: [{ name, count }]
    setDocs(Array.isArray(data) ? data : []);
  };

  useEffect(() => { load(); }, [jobId]);

  const totalCount = docs.reduce((s, d) => s + Number(d?.count ?? 0), 0);

  return (
    <section className="mb-6">
      <h3 className="text-xl font-semibold mb-2">Documents</h3>

      {/* Список лейблов вертикально */}
      <div className="docs-list-vertical">
        {docs.length === 0 ? (
          <div className="muted">No documents yet</div>
        ) : (
          <>
            {docs.map((d, i) => (
              <div className="doc-label" key={d.id || d._id || d.name || i}>
                <span className="doc-idx">{i + 1}.</span>
                <span className="doc-name">{d.name}</span>
                <span className="doc-count">{Number(d.count ?? 0)}</span>
              </div>
            ))}
            <div className="doc-total">Total {totalCount} documents</div>
          </>
        )}
      </div>


      <div className="exp-toolbar">
        <button
          type="button"
          className="bn-btn"
          onClick={() => jobId && setOpen(true)}
          disabled={!jobId}
          title={jobId ? "" : "Enter Job ID to add documents"}
        >
          <Plus size={18} /> Add Document
        </button>
      </div>

      {open && (
        <UploadDocModal
          jobId={jobId}
          onClose={() => setOpen(false)}
          onDone={() => { setOpen(false); load(); }}
        />
      )}
    </section>
  );
}
