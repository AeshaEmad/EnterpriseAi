import HistoryItem from "./HistoryItem";

function History({ entries = [], onView }) {
  return (
    <div className="history">
      <div className="history-intro">
        <div>
          <h3>Auto-fill history</h3>

          <p>Records of what the AI assistant filled for you.</p>
        </div>

        <span className="history-count">
          {entries.length} record
          {entries.length === 1 ? "" : "s"}
        </span>
      </div>

      {entries.length === 0 ? (
          <p className="history-empty">
            No history yet. Ask the AI assistant to fill the form,
            review it, and click Submit to save a record.
          </p>
      ) : (
        <div className="history-list">
          {entries.map((entry) => (
            <HistoryItem
              key={entry.id}
              entry={entry}
              onView={onView}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default History;
