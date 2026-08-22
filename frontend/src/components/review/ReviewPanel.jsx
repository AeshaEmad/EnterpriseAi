function ReviewPanel({
  schema = [],
  formData = {},
  fieldSources = {},
  fieldConfidence = {},
  onConfirm,
  onCancel,
  submitting = false,
}) {
  const rows = schema.map((field) => {
    const value = formData[field.name];
    const hasValue =
      value !== null && value !== undefined && String(value).trim() !== "";

    return {
      ...field,
      value: hasValue ? String(value) : "Missing",
      source: fieldSources[field.name] || "empty",
      confidence: fieldConfidence[field.name],
      missing: !hasValue && field.required,
    };
  });

  return (
    <div className="review-panel">
      <div className="review-summary">
        <div>
          <span className="eyebrow">REVIEW</span>
          <h4>Check the data before submit</h4>
        </div>
        <span className="review-count">
          {rows.filter((row) => !row.missing).length}/{rows.length} filled
        </span>
      </div>

      <div className="review-list">
        {rows.map((row) => (
          <div
            className={`review-row ${row.missing ? "missing" : ""}`}
            key={row.name}
          >
            <div>
              <span className="review-label">
                {row.label}
                {row.required && " *"}
              </span>
              <span className="review-value">{row.value}</span>
            </div>

            <span className={`review-source ${row.source}`}>
              {row.source === "ai" && "AI"}
              {row.source === "user" && "User"}
              {row.source === "empty" && "Empty"}
              {row.source === "ai" && typeof row.confidence === "number"
                ? ` ${Math.round(row.confidence * 100)}%`
                : ""}
            </span>
          </div>
        ))}
      </div>

      <div className="review-actions">
        <button
          className="btn secondary"
          type="button"
          onClick={onCancel}
          disabled={submitting}
        >
          Back to edit
        </button>
        <button
          className="btn primary"
          type="button"
          onClick={onConfirm}
          disabled={submitting}
        >
          {submitting ? "Submitting..." : "Confirm submit"}
        </button>
      </div>
    </div>
  );
}

export default ReviewPanel;
