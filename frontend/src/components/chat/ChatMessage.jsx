function ChatMessage({ sender, message }) {
  return (
    <div className="chat-message">
      <div className="message-avatar">{sender}</div>

      <div className="message-bubble">
        <p>{message}</p>
      </div>
    </div>
  );
}

export default ChatMessage;