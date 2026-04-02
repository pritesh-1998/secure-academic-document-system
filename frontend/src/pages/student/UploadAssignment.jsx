import { useState, useRef } from 'react';
import { mockTasks } from '../../data/mockData';

export default function UploadAssignment() {
  const [selectedTask, setSelectedTask] = useState('');
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setUploaded(false);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploaded(false);
    }
  };

  const handleUpload = () => {
    if (!file || !selectedTask) return;
    setUploading(true);
    // Simulate upload
    setTimeout(() => {
      setUploading(false);
      setUploaded(true);
    }, 2000);
  };

  const resetForm = () => {
    setFile(null);
    setSelectedTask('');
    setUploaded(false);
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-text">Upload Assignment</h2>
        <p className="text-sm text-text-secondary mt-1">
          Select an assignment and upload your file. Supported formats: PDF, DOCX, ZIP, images.
        </p>
      </div>

      {/* Success State */}
      {uploaded ? (
        <div className="bg-card rounded-xl border border-border p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-text">Upload Successful!</h3>
          <p className="text-sm text-text-secondary">
            Your assignment has been encrypted and submitted securely.
          </p>
          <div className="bg-bg rounded-lg p-4 text-left text-sm space-y-1">
            <p className="text-text-secondary">File: <span className="text-text font-medium">{file?.name}</span></p>
            <p className="text-text-secondary">Size: <span className="text-text font-medium">{file ? formatSize(file.size) : ''}</span></p>
            <p className="text-text-secondary">Status: <span className="text-success font-medium">🔒 Encrypted & Uploaded</span></p>
          </div>
          <button
            onClick={resetForm}
            className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors"
          >
            Upload Another
          </button>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border p-6 space-y-6">
          {/* Assignment Selector */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Select Assignment
            </label>
            <select
              id="task-selector"
              value={selectedTask}
              onChange={(e) => setSelectedTask(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-bg text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
            >
              <option value="">Choose an assignment...</option>
              {mockTasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title} — Due {task.deadline}
                </option>
              ))}
            </select>
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50 hover:bg-bg'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.docx,.doc,.zip,.png,.jpg,.jpeg,.txt"
            />
            <svg className="w-12 h-12 text-text-secondary mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <p className="text-sm font-medium text-text">
              Drop your file here or <span className="text-primary">browse</span>
            </p>
            <p className="text-xs text-text-secondary mt-1">
              PDF, DOCX, ZIP, Images — Max 50MB
            </p>
          </div>

          {/* Selected File Preview */}
          {file && (
            <div className="flex items-center gap-4 p-4 bg-bg rounded-lg">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text truncate">{file.name}</p>
                <p className="text-xs text-text-secondary">{formatSize(file.size)} · {file.type || 'Unknown type'}</p>
              </div>
              <button
                onClick={() => setFile(null)}
                className="text-text-secondary hover:text-danger transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Upload Button */}
          <button
            id="upload-submit"
            onClick={handleUpload}
            disabled={!file || !selectedTask || uploading}
            className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Encrypting & Uploading...
              </span>
            ) : (
              'Upload Assignment'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
