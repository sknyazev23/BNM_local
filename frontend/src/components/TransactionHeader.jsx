import React from "react";
import "../styles/transHeader.css";

export default function TransactionHeader({ isExpense = false }) {
  const descLabel = isExpense ? "Cost description": "Sale description";
  const unitLabel = isExpense ? "Cost per unit": "Price per unit";

  return (
    <div className="transaction-table">
      <div className="transaction-header">#</div>
      <div className="transaction-header">{descLabel}</div>
      <div className="transaction-header">Qty</div>
      <div className="transaction-header">{unitLabel}</div>
      <div className="transaction-header">Amount</div>
      <div className="transaction-header">Currency</div>
      <div className="transaction-header">Amount in AED</div>
      {isExpense ? (
        <div className="transaction-header">Seller</div>
      ) : (
        <div className="transaction-header"></div>
      )}
      <div className="transaction-header">Worker</div>
      <div className="transaction-header"></div>
    </div>
  );
}
