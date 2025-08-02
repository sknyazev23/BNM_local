import { Trash2 } from "lucide-react";
import "../styles/transactionBlock.css";

export default function ExpenseBlock({ expense, index, onChange, onRemove, workers }) {
  const handleChange = (field, value) => {
    onChange(index, field, value);
  };

  return (
    <div className="transaction-block">
      <div className="transaction-header">
        <h4 className="transaction-title">Expense #{index + 1}</h4>
        <button
          onClick={() => onRemove(index)}
          className="transaction-remove-button"
        >
          <Trash2 size={20} />
        </button>
      </div>

      <div className="transaction-grid">
        <input
          placeholder="№"
          value={expense.no || ""}
          onChange={(e) => handleChange("no", e.target.value)}
        />
        <input
          placeholder="Description"
          value={expense.description || ""}
          onChange={(e) => handleChange("description", e.target.value)}
        />
        <input
          placeholder="Quantity"
          type="number"
          value={expense.quantity || ""}
          onChange={(e) => handleChange("quantity", parseInt(e.target.value))}
        />
        <input
          placeholder="Cost per unit"
          type="number"
          value={expense.unit_cost || ""}
          onChange={(e) => handleChange("unit_cost", parseFloat(e.target.value))}
        />
        <input
          placeholder="Amount"
          type="number"
          value={expense.amount || ""}
          onChange={(e) => handleChange("amount", parseFloat(e.target.value))}
        />
        <select
          value={expense.currency || ""}
          onChange={(e) => handleChange("currency", e.target.value)}
        >
          <option value="">Currency</option>
          <option value="USD">USD</option>
          <option value="AED">AED</option>
          <option value="RUB">RUB</option>
          <option value="EUR">EUR</option>
        </select>
        <input
          placeholder="Amount in AED"
          type="number"
          value={expense.amount_aed || ""}
          onChange={(e) => handleChange("amount_aed", parseFloat(e.target.value))}
        />
        <input
          placeholder="Seller"
          value={expense.seller || ""}
          onChange={(e) => handleChange("seller", e.target.value)}
        />
        <select
          value={expense.worker || ""}
          onChange={(e) => handleChange("worker", e.target.value)}
        >
          <option value="">Choose worker</option>
          {workers.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
