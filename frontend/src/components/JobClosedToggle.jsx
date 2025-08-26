export default function JobClosedToggle({ isClosed, onToggle, pending }) {
  return (
    <div className="job-toggle">
      <label className={`toggle ${isClosed ? "is-closed" : "is-open"}`}>
        <input
          type="checkbox"
          checked={isClosed}
          onChange={onToggle}
          disabled={pending}
        />
        <span className="toggle-track">
          <span className="toggle-thumb" />
        </span>
        <span className="toggle-text">
          {isClosed ? "Closed Job" : "Unclosed Job"}
        </span>
      </label>
    </div>
  );
}
