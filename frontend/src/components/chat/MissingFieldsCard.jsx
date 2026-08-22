import { useState } from "react";

function MissingFieldsCard({ missingFields, schema, onFieldFocus }) {
  const [expandedFields, setExpandedFields] = useState(new Set());

  const toggleField = (fieldName) => {
    setExpandedFields((prev) => {
      const next = new Set(prev);
      if (next.has(fieldName)) {
        next.delete(fieldName);
      } else {
        next.add(fieldName);
      }
      return next;
    });
  };

  const fieldInfo = missingFields.map((fieldName) => {
    const field = schema.find((f) => f.name === fieldName);
    return {
      name: fieldName,
      label: field?.label || fieldName,
      type: field?.type || "text",
      placeholder: field?.placeholder || "",
      options: field?.options || [],
      required: field?.required || false,
    };
  });

  return (
    <div className="missing-fields-card">
      <div className="missing-fields-header">
        <div className="missing-fields-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </div>
        <div className="missing-fields-title">
          <h4>Missing Required Fields</h4>
          <p>{missingFields.length} field{missingFields.length !== 1 ? "s" : ""} need to be filled</p>
        </div>
      </div>

      <div className="missing-fields-list">
        {fieldInfo.map((field) => (
          <div
            key={field.name}
            className={`missing-field-item ${expandedFields.has(field.name) ? "expanded" : ""}`}
          >
            <button
              className="missing-field-main"
              type="button"
              onClick={() => toggleField(field.name)}
            >
              <div className="missing-field-info">
                <span className="missing-field-label">{field.label}</span>
                <span className="missing-field-name">({field.name})</span>
                <span className={`field-type-badge type-${field.type.toLowerCase()}`}>
                  {field.type}
                </span>
                {field.required && <span className="required-badge">Required</span>}
              </div>
              <span className="expand-toggle">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </span>
            </button>

            {expandedFields.has(field.name) && (
              <div className="missing-field-details">
                <div className="field-guide">
                  {field.options && field.options.length > 0 && (
                    <div className="field-options">
                      <span className="options-label">Options:</span>
                      <div className="options-chips">
                        {field.options.map((opt, idx) => (
                          <span key={idx} className="option-chip">
                            {opt}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {field.placeholder && (
                    <div className="field-placeholder">
                      <span className="placeholder-label">Format:</span>
                      <span className="placeholder-value">{field.placeholder}</span>
                    </div>
                  )}
                  <button
                    className="btn fill-field-btn"
                    type="button"
                    onClick={() => onFieldFocus(field.name)}
                  >
                    Fill this field
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default MissingFieldsCard;