import { Trash2, Pencil } from "lucide-react";
import "../styles/transactionBlock.css";

export default function ExpenseBlock({ expense, index, onRemove, onEdit }) {
  return (
    <div className="transaction-table">
      <div className="transaction-cell">{expense.no}</div>
      <div className="transaction-cell">{expense.description}</div>
      <div className="transaction-cell">{expense.quantity}</div>
      <div className="transaction-cell">{expense.unit_cost}</div>
      <div className="transaction-cell">{expense.amount}</div>
      <div className="transaction-cell">{expense.currency}</div>
      <div className="transaction-cell">{expense.amount_aed}</div>
      <div className="transaction-cell">{expense.seller}</div>
      <div className="transaction-cell">{expense.worker}</div>

      {/* Кнопки Edit и Delete в конце строки */}
      <div className="transaction-actions">
        <button className="icon-button" onClick={() => onEdit(index)}>
          <Pencil size={18} />
        </button>
        <button className="icon-button" onClick={() => onRemove(index)}>
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}