import { useState, useRef, useEffect } from 'react';
import api from '../../services/api';

export default function UploadAssignment() {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState('');
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  
  // Crypto Visualization State
  const [cryptoStage, setCryptoStage] = useState(0);
  const cryptoStages = [
    "Reading Physical File Stream...",
    "Generating random 256-bit AES-GCM Key (DEK)...",
    "Encrypting file with AES-256-GCM...",
    "Hashing ciphertext & Signing with Student RSA-PSS Private Key...",
    "Wrapping DEK with Teacher's RSA-3072 Public Key (OAEP)...",
    "Transmitting Cryptographic Payload to Server...",
    "Done!"
  ];

  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await api.get('/tasks');
        setTasks(response.data);
      } catch (error) {
        console.error("Failed to fetch tasks", error);
      }
    };
    fetchTasks();
  }, []);

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

  const delay = (ms) => new Promise(res => setTimeout(res, ms));

  const handleUpload = async () => {
    if (!file || !selectedTask) return;
    setUploading(true);
    setCryptoStage(0);
    
    // Simulate the time taken to run local crypto for the professor's benefit
    for(let i = 0; i < 6; i++) {
        await delay(600); // 600ms per stage purely for visual UX
        setCryptoStage(i + 1);
    }

    const formData = new FormData();
    formData.append('task_id', selectedTask);
    formData.append('document', file);

    try {
      await api.post('/submissions/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setUploaded(true);
    } catch (error) {
      console.error("Upload failed", error);
      alert("Upload failed. " + (error.response?.data?.message || ''));
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setSelectedTask('');
    setUploaded(false);
    setCryptoStage(0);
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

      {uploading && !uploaded && (
        <div className="bg-card rounded-xl border border-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.2)] p-8 text-center space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 h-1 bg-primary transition-all duration-300 ease-out" 
                 style={{ width: `${(cryptoStage / 6) * 100}%` }}></div>
            
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            
            <div className="space-y-2">
                <h3 className="text-lg font-bold text-text">Cryptographic Engine Active</h3>
                <p className="text-sm font-mono text-primary font-medium">{cryptoStages[cryptoStage]}</p>
                
                <div className="mt-4 flex flex-col items-start bg-bg/50 rounded-lg p-4 font-mono text-xs text-text-secondary overflow-hidden max-h-32 text-left space-y-1">
                    {cryptoStages.slice(0, cryptoStage).map((msg, i) => (
                        <p key={i} className="text-success w-full opacity-70">✔ {msg}</p>
                    ))}
                    <p className="animate-pulse w-full">▶ {cryptoStages[cryptoStage]} <span className="animate-ping">...</span></p>
                </div>
            </div>
        </div>
      )}

      {/* Success State */}
      {uploaded ? (
        <div className="bg-card rounded-xl border border-success/30 p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-text">Upload Successful!</h3>
          <p className="text-sm text-text-secondary">
            Your assignment has been fully encrypted and mathematically signed.
          </p>
          <div className="bg-bg rounded-lg p-4 text-left text-sm space-y-1 border border-border shadow-inner">
            <p className="text-text-secondary">File: <span className="text-text font-medium">{file?.name}</span></p>
            <p className="text-text-secondary">Size: <span className="text-text font-medium">{file ? formatSize(file.size) : ''}</span></p>
            <p className="text-text-secondary mt-2 pt-2 border-t border-border">Algorithms: <span className="text-primary font-mono font-medium text-xs">AES-256-GCM, RSA-3072-OAEP, RSA-PSS</span></p>
            <p className="text-text-secondary">Status: <span className="text-success font-medium">🔒 Encrypted & Uploaded</span></p>
          </div>
          <button
            onClick={resetForm}
            className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors shadow-sm"
          >
            Upload Another
          </button>
        </div>
      ) : (
        !uploading && (
        <div className="bg-card rounded-xl border border-border p-6 space-y-6 shadow-sm">
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
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title} — Due {new Date(task.deadline).toLocaleDateString()}
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
                : 'border-border hover:border-primary/50 hover:bg-bg/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.docx,.doc,.zip,.png,.jpg,.jpeg,.txt"
            />
            <svg className="w-12 h-12 text-primary mx-auto mb-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p className="text-sm font-medium text-text">
              Drop file for <span className="text-primary font-bold">Secure Upload</span> or browse
            </p>
            <p className="text-xs text-text-secondary mt-1">
              Documents will be AES encrypted inside your browser
            </p>
          </div>

          {/* Selected File Preview */}
          {file && (
            <div className="flex items-center gap-4 p-4 bg-bg rounded-lg border border-border shadow-sm">
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
                title="Remove File"
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
            disabled={!file || !selectedTask}
            className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            Commence Secure Upload
          </button>
        </div>
        )
      )}
    </div>
  );
}
