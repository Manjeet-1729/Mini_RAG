/**
 * Sidebar component with chat sessions and document list
 */
import { useState } from 'react';
import DocumentUploadModal from './DocumentUploadModal';

export default function Sidebar({ 
  sessions, 
  currentSessionId, 
  onSessionSelect, 
  onNewSession,
  onDeleteSession,
  currentSessionDocuments,
  health 
}) {
  const [showUploadModal, setShowUploadModal] = useState(false);

  return (
    <div className="sidebar">
      {/* Header with New Chat button */}
      <div className="sidebar-header">
        <button className="btn-new-chat" onClick={onNewSession}>
          + New chat
        </button>
      </div>

      {/* Chat Sessions List */}
      <div className="sessions-list">
        {sessions.map(session => (
          <div
            key={session.id}
            className={`session-item ${session.id === currentSessionId ? 'active' : ''}`}
            onClick={() => onSessionSelect(session.id)}
          >
            <div className="session-content">
              <span className="session-icon">💬</span>
              <div className="session-info">
                <div className="session-title">{session.title}</div>
                {session.documents.length > 0 && (
                  <div className="session-doc-count">
                    {session.documents.length} document{session.documents.length > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
            {session.id === currentSessionId && (
              <button
                className="btn-delete-session"
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('Delete this conversation?')) {
                    onDeleteSession(session.id);
                  }
                }}
                title="Delete conversation"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Documents in Current Session */}
      <div className="sidebar-documents">
        <div className="documents-header">
          <h3>📚 Documents ({currentSessionDocuments.length})</h3>
          <button 
            className="btn-upload-doc"
            onClick={() => setShowUploadModal(true)}
            title="Upload document"
          >
            +
          </button>
        </div>

        {currentSessionDocuments.length === 0 ? (
          <div className="empty-documents">
            <p>No documents uploaded yet</p>
            <button 
              className="btn-upload-empty"
              onClick={() => setShowUploadModal(true)}
            >
              Upload Documents
            </button>
          </div>
        ) : (
          <div className="documents-list">
            {currentSessionDocuments.map((doc, idx) => (
              <div key={idx} className="document-item">
                <span className="doc-icon">📄</span>
                <div className="doc-info">
                  <div className="doc-title">{doc.title}</div>
                  <div className="doc-meta">
                    {doc.chunks_created} chunks · {doc.links_extracted} links
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer with connection status */}
      <div className="sidebar-footer">
        {health && (
          <div className={`connection-status ${health.status === 'healthy' ? 'connected' : 'disconnected'}`}>
            <span className="status-dot"></span>
            {health.status === 'healthy' ? 'Connected' : 'Disconnected'}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <DocumentUploadModal
          sessionId={currentSessionId}
          onClose={() => setShowUploadModal(false)}
        />
      )}
    </div>
  );
}