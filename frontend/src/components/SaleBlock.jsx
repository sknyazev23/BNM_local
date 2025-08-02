import { Trash2, Plus } from "lucide-react";
import "../styles/transactionBlock.css";

export default function SaleBlock({ sale, index, onChange, onRemove, workers, onAddWorker }) {
  return (
    <div className="transaction-block">
      <div className="header">
        <h4>Sale #{index + 1}</h4>
        <button
          onClick={() => onRemove(index)}
          className="text-red-400 hover:text-red-500 transform hover:scale-110 transition"
        >
          <Trash2 size={20} />
        </button>
      </div>
      <input
        placeholder="Description"
        value={sale.description}
        onChange={(e) => onChange(index, "description", e.target.value)}
      />
      <input
        placeholder="Sale (USD)"
        type="number"
        value={sale.cost.USD}
        onChange={(e) =>
          onChange(index, "cost", { ...sale.cost, USD: parseFloat(e.target.value) })
        }
      />
      <div className="worker-select">
        <select
          value={sale.worker || ""}
          onChange={(e) => onChange(index, "worker", e.target.value)}
        >
          <option value="">Choose worker</option>
          {workers.map((w) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
        <button onClick={onAddWorker} className="add-worker-button">
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
}
