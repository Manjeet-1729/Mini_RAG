/**
 * Message bubble component - displays individual chat messages
 * (User messages only)
 */
export default function MessageBubble({ message, isUser }) {
  if (!isUser) return null; // ⛔ stop assistant from printing here

  return (
    <div className="message-bubble user">
      <div className="message-header">
        <span className="message-role">👤 You</span>
      </div>
      <div className="message-content">
        {message}
      </div>
    </div>
  );
}
