import MissingFieldsCard from "./MissingFieldsCard";
import ClarificationCard from "./ClarificationCard";

function ChatMessage({ sender, message, payload, schema, onClarify, onFieldFocus }) {
  // AI structural messages render rich cards; everything else is plain text.
  if (sender === "AI" && payload) {
    return (
      <div className="chat-message ai">
        <div className="message-avatar">AI</div>
        <div className="message-bubble">
          {message && <p className="ai-summary">{message}</p>}

          {payload.missingFields && payload.missingFields.length > 0 && (
            <MissingFieldsCard
              missingFields={payload.missingFields}
              schema={schema}
              onFieldFocus={onFieldFocus}
            />
          )}

          {payload.clarifications && payload.clarifications.length > 0 && (
            <div className="clarifications-block">
              {payload.clarifications.map((c, idx) => (
                <ClarificationCard
                  key={`${c.field}-${idx}`}
                  clarification={c}
                  onRespond={onClarify}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`chat-message ${sender === "You" ? "user" : "ai"}`}>
      <div className="message-avatar">{sender === "You" ? "Y" : "AI"}</div>
      <div className="message-bubble">
        <p>{message}</p>
      </div>
    </div>
  );
}

export default ChatMessage;
