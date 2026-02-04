/**
 * Chat interface component - main query interface with chat history
 */
import { useState, useRef, useEffect } from 'react';
import { sendQuery } from '../services/api';
import MessageBubble from './MessageBubble';
import AnswerPanel from './AnswerPanel';

// Common greetings that don't need RAG
const GREETINGS = [
  'hi', 'hello', 'hey', 'greetings', 'good morning', 
  'good afternoon', 'good evening', 'what\'s up', 'whats up',
  'how are you', 'howdy', 'sup'
];

const isGreeting = (text) => {
  const normalized = text.toLowerCase().trim();
  return GREETINGS.some(greeting => 
    normalized === greeting || normalized.startsWith(greeting + ' ')
  );
};

export default function ChatInterface({ 
  sessionId, 
  sessionDocuments, 
  initialMessages,
  initialChatHistory,
  onDocumentAdded,
  onMessagesUpdate,
  onChatHistoryUpdate,
  onTitleUpdate
}) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState(initialMessages || []);
  const [chatHistory, setChatHistory] = useState(initialChatHistory || []);
  
  const chatEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Listen for document uploads
  useEffect(() => {
    const handleDocumentUpload = (e) => {
      onDocumentAdded(e.detail);
    };

    window.addEventListener('documentUploaded', handleDocumentUpload);
    return () => window.removeEventListener('documentUploaded', handleDocumentUpload);
  }, [onDocumentAdded]);

  // Update parent when messages change
  useEffect(() => {
    onMessagesUpdate(messages);
  }, [messages, onMessagesUpdate]);

  // Update parent when chat history changes
  useEffect(() => {
    onChatHistoryUpdate(chatHistory);
  }, [chatHistory, onChatHistoryUpdate]);

  const handleGreeting = (greetingText) => {
    const responses = [
      "Hello! How can I help you with your documents today?",
      "Hi there! I'm ready to answer questions about your uploaded documents.",
      "Hey! What would you like to know about your documents?",
      "Hello! Feel free to ask me anything about the documents you've uploaded.",
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    return randomResponse;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!query.trim()) {
      setError('Please enter a question');
      return;
    }

    setLoading(true);
    setError(null);

    const currentQuery = query;
    setQuery('');

    // Add user message immediately
    const userMessage = {
      type: 'user',
      content: currentQuery,
      timestamp: Date.now()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    // Update title if first query
    if (messages.length === 0) {
      onTitleUpdate(currentQuery);
    }

    try {
      // Check if it's a greeting
      if (isGreeting(currentQuery)) {
        const greetingResponse = handleGreeting(currentQuery);
        
        const assistantMessage = {
          type: 'assistant',
          content: greetingResponse,
          timestamp: Date.now(),
          isGreeting: true
        };

        setMessages(prev => [...prev, assistantMessage]);
        setLoading(false);
        return;
      }

      // Check if documents are uploaded (for non-greetings)
      if (sessionDocuments.length === 0) {
        setError('Please upload at least one document first');
        setLoading(false);
        return;
      }

      // Update chat history for context
      const newChatHistory = [
        ...chatHistory,
        { role: 'user', content: currentQuery }
      ];
      setChatHistory(newChatHistory);

      // Prepare API chat history (last 6 messages = 3 turns)
      const apiChatHistory = newChatHistory.slice(-6);

      // Send query to RAG system
      const response = await sendQuery(currentQuery, apiChatHistory, sessionId);
      
      // Add assistant message with full response
      const assistantMessage = {
        type: 'assistant',
        content: response.answer,
        response: response, // Store full response for AnswerPanel
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Update chat history
      setChatHistory(prev => [
        ...prev,
        { role: 'assistant', content: response.answer }
      ]);

    } catch (err) {
      setError(err.response?.data?.detail || 'Error processing query');
      // Remove user message on error
      setMessages(messages);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-container-wrapper">
      <div className="chat-header">
        <div>
          <h2>🔍 RAG Application</h2>
          <p className="chat-subtitle">Chat with Your Documents</p>
        </div>
        {sessionDocuments.length > 0 && (
          <div className="header-info">
            <span className="doc-badge">
              {sessionDocuments.length} document{sessionDocuments.length > 1 ? 's' : ''} loaded
            </span>
          </div>
        )}
      </div>

      {/* Scrollable Chat Area */}
      <div className="chat-scrollable-area">
        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="chat-empty">
              {sessionDocuments.length === 0 ? (
                <>
                  <h3>👋 Welcome!</h3>
                  <p>Upload documents from the sidebar to get started</p>
                  <div className="empty-icon">📚</div>
                </>
              ) : (
                <>
                  <h3>👋 Ready to chat!</h3>
                  <p>Ask me anything about your documents</p>
                  <div className="examples">
                    <strong>Try asking:</strong><br />
                    "What are the main topics?"<br />
                    "Summarize the key points"<br />
                    "What links are referenced?"
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              {messages.map((msg, idx) => (
                <div key={msg.timestamp || idx}>
                  <MessageBubble
                    message={msg.content}
                    isUser={msg.type === 'user'}
                  />
                  
                  {/* Show AnswerPanel for assistant messages with full response */}
                  {msg.type === 'assistant' && msg.response && !msg.isGreeting && (
                    <AnswerPanel response={msg.response} />
                  )}
                </div>
              ))}
            </>
          )}

          {loading && (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <span>Thinking...</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-banner-fixed">
          {error}
          <button onClick={() => setError(null)} className="btn-close-error">×</button>
        </div>
      )}

      {/* Query Input */}
      <form onSubmit={handleSubmit} className="query-form">
        <input
          type="text"
          placeholder="Ask a question about your documents..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={loading}
          className="query-input"
        />
        <button 
          type="submit" 
          disabled={loading || !query.trim()}
          className="btn-send"
        >
          {loading ? '⏳' : '➤'}
        </button>
      </form>
    </div>
  );
}