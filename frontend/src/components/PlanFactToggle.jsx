import React from "react";


export default function PlanFactToggle({ value = true, onChange, className = "", disabled = false }) {
  return (
    <div className={`pf-toggle ${className}`} role="group" aria-label="Plan/Fact">
      <button
        type="button"
        className={`pf-btn ${value ? "active" : ""}`}
        onClick={() => onChange?.(true)}
        disabled={disabled}
      >
        Plan
      </button>
      <button
        type="button"
        className={`pf-btn ${!value ? "active" : ""}`}
        onClick={() => onChange?.(false)}
        disabled={disabled}
      >
        Fact
      </button>
    </div>
  );
}
