import { useState } from "react";

function ChatInput({ onSend, disabled = false }) {
  const [message, setMessage] = useState("");

  const handleSubmit = () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || disabled) {
      return;
    }

    onSend(trimmedMessage);
    setMessage("");
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div className="chat-input">
      <textarea
        placeholder={
          disabled
            ? "Waiting for response..."
            : "Describe what you'd like to fill..."
        }
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        rows={2}
      />

      <button
        type="button"
        onClick={handleSubmit}
        disabled={disabled}
      >
        ↑
      </button>
    </div>
  );
}

export default ChatInput;
