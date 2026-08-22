function formatFieldName(name) {
  return name
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

function HistoryItem({ entry, onView }) {
  const date = new Date(entry.timestamp).toLocaleString();

  const details = entry.fields
    .map((field) => {
      const meta = entry.meta?.[field] || {};
      const confidence =
        typeof meta.confidence === "number"
          ? ` ${Math.round(meta.confidence * 100)}%`
          : "";

      return `${formatFieldName(field)} (${meta.source || "saved"}${confidence})`;
    })
    .join(", ");

  return (
    <div className="history-card">
      <div className="history-main">
        <span className="history-icon">AI</span>

        <div className="history-info">
          <div className="history-title">
            <h4>{entry.title}</h4>

            <span className="accepted-badge">{entry.status || "Submitted"}</span>
          </div>

          <div className="history-details">{details}</div>
        </div>
      </div>

      <div className="history-meta">
        <span className="history-id">#{entry.id}</span>

        <span className="history-date">{date}</span>

        <button
          className="view-button"
          type="button"
          onClick={() => onView(entry)}
        >
          View
        </button>
      </div>
    </div>
  );
}

export default HistoryItem;
