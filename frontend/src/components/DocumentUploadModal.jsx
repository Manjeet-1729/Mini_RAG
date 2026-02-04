/**
 * Document upload modal with success/error notifications
 */
import { useState } from 'react';
import { uploadDocument, processText } from '../services/api';

export default function DocumentUploadModal({ sessionId, onClose }) {
  const [activeTab, setActiveTab] = useState('upload');
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const showNotification = (message, type = 'success') => {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Trigger animation
    setTimeout(() => notification.classList.add('show'), 10);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
  };

  const handleTextSubmit = async (e) => {
    e.preventDefault();
    
    if (!text.trim()) {
      showNotification('Please enter some text', 'error');
      return;
    }

    setLoading(true);

    try {
      const result = await processText(text, title || 'Pasted Text');
      
      // Notify parent component
      window.dispatchEvent(new CustomEvent('documentUploaded', { 
        detail: result 
      }));

      showNotification(
        `✓ Document processed! Created ${result.chunks_created} chunks with ${result.links_extracted} links`,
        'success'
      );

      // Close modal
      setTimeout(() => onClose(), 1000);
    } catch (err) {
      showNotification(
        `✗ Error: ${err.response?.data?.detail || 'Failed to process text'}`,
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFileSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      showNotification('Please select a file', 'error');
      return;
    }

    setLoading(true);

    try {
      const result = await uploadDocument(file, title);

      // Notify parent component
      window.dispatchEvent(new CustomEvent('documentUploaded', { 
        detail: result 
      }));

      showNotification(
        `✓ ${file.name} uploaded! Created ${result.chunks_created} chunks with ${result.links_extracted} links`,
        'success'
      );

      // Close modal
      setTimeout(() => onClose(), 1000);
    } catch (err) {
      showNotification(
        `✗ Error: ${err.response?.data?.detail || 'Failed to upload file'}`,
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📄 Upload Documents</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        {/* Tabs */}
        <div className="modal-tabs">
          <button
            className={`tab ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            Upload File
          </button>
          <button
            className={`tab ${activeTab === 'paste' ? 'active' : ''}`}
            onClick={() => setActiveTab('paste')}
          >
            Paste Text
          </button>
        </div>

        <div className="modal-body">
          {/* Upload File Tab */}
          {activeTab === 'upload' && (
            <form onSubmit={handleFileSubmit}>
              <input
                type="text"
                placeholder="Document title (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input"
              />
              
              <div className="file-upload-area">
                <input
                  id="file-input"
                  type="file"
                  accept=".pdf,.txt,.md"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="file-input"
                />
                <label htmlFor="file-input" className="file-label">
                  {file ? (
                    <>
                      <span className="file-icon">📄</span>
                      <span>{file.name}</span>
                    </>
                  ) : (
                    <>
                      <span className="upload-icon">⬆️</span>
                      <span>Choose file (PDF, TXT, MD)</span>
                      <span className="file-hint">or drag and drop</span>
                    </>
                  )}
                </label>
              </div>

              <button 
                type="submit" 
                disabled={loading || !file}
                className="btn btn-primary btn-block"
              >
                {loading ? 'Uploading...' : 'Upload & Process'}
              </button>
            </form>
          )}

          {/* Paste Text Tab */}
          {activeTab === 'paste' && (
            <form onSubmit={handleTextSubmit}>
              <input
                type="text"
                placeholder="Document title (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input"
              />
              
              <textarea
                placeholder="Paste your text here... (supports markdown, links, etc.)"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={10}
                className="textarea"
              />

              <button 
                type="submit" 
                disabled={loading}
                className="btn btn-primary btn-block"
              >
                {loading ? 'Processing...' : 'Process Text'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}