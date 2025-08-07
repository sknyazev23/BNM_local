import React from "react";
import "../styles/transHeader.css";

export default function TransactionHeader({ isExpense = false }) {
  return (
    <div className="transaction-table">
      <div className="transaction-header">№</div>
      <div className="transaction-header">Cost description</div>
      <div className="transaction-header">Qty</div>
      <div className="transaction-header">Cost per unit</div>
      <div className="transaction-header">Amount</div>
      <div className="transaction-header">Currency</div>
      <div className="transaction-header">Amount in AED</div>
      {isExpense && <div className="transaction-header">Seller</div>}
      <div className="transaction-header">Worker</div>
      <div className="transaction-header"></div>
    </div>
  );
}
