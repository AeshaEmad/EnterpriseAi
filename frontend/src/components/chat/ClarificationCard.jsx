import { useState } from "react";

function ClarificationCard({ clarification, onRespond }) {
  const [inputValue, setInputValue] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onRespond(clarification.field, inputValue.trim());
      setInputValue("");
    }
  };

  const handleSuggestionClick = (suggestion) => {
    onRespond(clarification.field, suggestion);
    setInputValue("");
  };

  return (
    <div className="clarification-card">
      <button
        className="clarification-header"
        onClick={() => setIsExpanded(!isExpanded)}
        type="button"
      >
        <div className="clarification-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
        </div>
        <div className="clarification-content">
          <span className="clarification-field">{clarification.field}</span>
          <span className="clarification-question">{clarification.question}</span>
        </div>
        <span className={`expand-icon ${isExpanded ? "expanded" : ""}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>

      {isExpanded && (
        <div className="clarification-body">
          {clarification.suggestions && clarification.suggestions.length > 0 && (
            <div className="clarification-suggestions">
              <span className="suggestions-label">Suggestions:</span>
              <div className="suggestions-list">
                {clarification.suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    className="suggestion-chip"
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form className="clarification-input-form" onSubmit={handleSubmit}>
            <input
              type="text"
              className="clarification-input"
              placeholder={`Enter ${clarification.field}...`}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              autoFocus
            />
            <button
              type="submit"
              className="btn clarification-submit"
              disabled={!inputValue.trim()}
            >
              Submit
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default ClarificationCard;