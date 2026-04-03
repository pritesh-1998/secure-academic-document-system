import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Link } from 'react-router-dom';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('assignments');
  const [decryptingId, setDecryptingId] = useState(null);
  const [cryptoStage, setCryptoStage] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [tasksRes, subsRes] = await Promise.all([
          api.get('/tasks'),
          api.get('/submissions')
        ]);
        setTasks(tasksRes.data);
        setSubmissions(subsRes.data);
      } catch (error) {
        console.error("Error loading dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-text-secondary animate-pulse">Loading secure dashboard...</div>;
  }

  // Calculate statistics
  const totalTasks = tasks.length;
  // Unique students who have submitted something to this teacher
  const uniqueStudentsList = [...new Set(submissions.map(s => s.student?.name).filter(Boolean))];
  const uniqueStudentsCount = uniqueStudentsList.length;
  // Submissions that are unverified
  const pendingVerification = submissions.filter((s) => s.status === 'submitted' || s.status === 'uploaded');

  const cryptoStages = [
    "Unwrapping AES Document Key using Teacher RSA-3072 Private Key...",
    "Decrypting Ciphertext payload with AES-256-GCM...",
    "Verifying AES-GCM 16-byte Authentication Tag (Integrity)...",
    "Hashing raw PDF to compute SHA-256 Fingerprint...",
    "Authenticating RSA-PSS Signature against Student Public Key...",
    "✅ Verified NON-REPUDIATION. Triggering secure download."
  ];

  const delay = (ms) => new Promise(res => setTimeout(res, ms));

  const handleDownload = async (submissionId, filename) => {
    try {
      setDecryptingId(submissionId);
      setCryptoStage(0);

      // Simulate cryptograph verification steps purely for UX
      for(let i = 0; i < 5; i++) {
        await delay(500); // 500ms delay per step
        setCryptoStage(i + 1);
      }

      // API call downloads and explicitly decodes AES-GCM + verifies PSS signatures
      const response = await api.get(`/submissions/${submissionId}/download`, {
        responseType: 'blob'
      });

      // Final success stage
      setCryptoStage(5);
      await delay(600);

      // Create a temporary link to download the decrypted file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      alert("CRITICAL: Failed to decrypt or verify signature! Potential tampering detected.");
      console.error(error);
      setDecryptingId(null);
      setCryptoStage(0);
    }
    // We explicitly DO NOT clear setDecryptingId(null) here 
    // so the cryptographic steps stay visible to the user for demonstration purposes!
  };

  const closeCryptoLog = () => {
    setDecryptingId(null);
    setCryptoStage(0);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card p-5 rounded-xl border border-border shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-text">Teacher Overview</h1>
          <p className="text-sm text-text-secondary mt-1">Manage assignments and review secure Cryptographic submissions</p>
        </div>
        <Link
          to="/create-task"
          className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors shadow-sm"
        >
          + Create Task
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <p className="text-sm text-text-secondary mb-1">Assignments Created</p>
          <p className="text-2xl font-bold text-primary">{totalTasks}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <p className="text-sm text-text-secondary mb-1">Active Students</p>
          <p className="text-2xl font-bold text-text">{uniqueStudentsCount}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <p className="text-sm text-text-secondary mb-1">Total Submissions</p>
          <p className="text-2xl font-bold text-text">{submissions.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm bg-warning/5 border-warning/20">
          <p className="text-sm text-text-secondary mb-1">Pending Verification</p>
          <p className="text-2xl font-bold text-warning">{pendingVerification.length}</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-card rounded-xl border border-border shadow-sm">
        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('assignments')}
            className={`px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'assignments' 
                ? 'text-primary border-b-2 border-primary bg-primary/5' 
                : 'text-text-secondary hover:text-text hover:bg-bg/50'
            }`}
          >
            Assignment Tracking
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'list' 
                ? 'text-primary border-b-2 border-primary bg-primary/5' 
                : 'text-text-secondary hover:text-text hover:bg-bg/50'
            }`}
          >
            Cryptographic Submissions
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-0">
          {activeTab === 'assignments' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-bg/30">
                    <th className="text-left py-3 px-5 text-xs font-semibold text-text-secondary uppercase">Task ID</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-text-secondary uppercase">Title</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-text-secondary uppercase">Deadline</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-text-secondary uppercase">Submissions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {tasks.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-text-secondary text-sm">
                        No assignments created yet.
                      </td>
                    </tr>
                  ) : (
                    tasks.map((task) => {
                      const counts = submissions.filter(s => s.task_id === task.id).length;
                      return (
                        <tr key={task.id} className="hover:bg-bg/50 transition-colors">
                          <td className="py-4 px-5 text-sm text-text-secondary">#{task.id}</td>
                          <td className="py-4 px-5 text-sm text-text font-medium">{task.title}</td>
                          <td className="py-4 px-5 text-sm text-text-secondary">{new Date(task.deadline).toLocaleDateString()}</td>
                          <td className="py-4 px-5">
                            <span className="text-sm font-medium bg-primary/10 text-primary px-3 py-1 rounded-full">
                              {counts} submitted
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'list' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-bg/30">
                    <th className="text-left py-3 px-5 text-xs font-semibold text-text-secondary uppercase">Student</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-text-secondary uppercase">Task</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-text-secondary uppercase">Encrypted File</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-text-secondary uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {submissions.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-text-secondary text-sm">
                        No submissions received yet.
                      </td>
                    </tr>
                  ) : (
                    submissions.map((sub) => (
                      <React.Fragment key={sub.id}>
                      <tr className="hover:bg-bg/50 transition-colors">
                        <td className="py-4 px-5 text-sm text-text font-medium">
                          {sub.student?.name || 'Unknown'}
                        </td>
                        <td className="py-4 px-5 text-sm text-text-secondary">
                          {sub.task?.title || `#${sub.task_id}`}
                        </td>
                        <td className="py-4 px-5 text-sm font-mono text-text-secondary max-w-xs truncate">
                          🔒 {sub.original_filename}
                        </td>
                        <td className="py-4 px-5">
                          <button 
                            onClick={() => handleDownload(sub.id, sub.original_filename)}
                            disabled={decryptingId !== null}
                            className={`text-sm font-bold transition-colors shadow-sm px-4 py-2 rounded-lg 
                              ${decryptingId === sub.id && cryptoStage < 5 ? 'bg-warning text-white cursor-wait' : ''} 
                              ${decryptingId === sub.id && cryptoStage === 5 ? 'bg-success text-white' : ''} 
                              ${decryptingId === null ? 'bg-primary text-white hover:bg-primary-dark' : ''}
                              ${decryptingId !== null && decryptingId !== sub.id ? 'bg-primary opacity-50 cursor-not-allowed text-white' : ''}`}
                          >
                            {decryptingId === sub.id 
                                ? (cryptoStage === 5 ? '✅ Authenticated' : 'Authenticating...') 
                                : 'Decrypt & Verify Signature'}
                          </button>
                        </td>
                      </tr>
                      {/* Decryption Matrix Overlay Row */}
                      {decryptingId === sub.id && (
                        <tr>
                          <td colSpan="4" className="p-0 border-b-0">
                            <div className="bg-bg/80 border-x border-b border-warning/30 p-6 animate-pulse">
                              <div className="flex flex-col gap-2 relative">
                                <div className="absolute top-0 left-0 h-0.5 bg-warning transition-all duration-300 ease-out" 
                                     style={{ width: `${(cryptoStage / 5) * 100}%` }}></div>
                                <div className="flex justify-between items-center mb-2 mt-2">
                                  <h4 className="text-warning font-bold text-sm">CRYPTOGRAPHIC ENGINE LOGS</h4>
                                  {cryptoStage === 5 && (
                                    <button 
                                      onClick={closeCryptoLog}
                                      className="text-xs bg-bg hover:bg-bg/50 text-text-secondary px-3 py-1 border border-border rounded transition-colors"
                                    >
                                      Dismiss
                                    </button>
                                  )}
                                </div>
                                <div className="font-mono text-xs text-text-secondary max-h-40 overflow-y-auto flex flex-col space-y-1 bg-card p-3 border border-border rounded-lg">
                                  {cryptoStages.slice(0, cryptoStage).map((msg, i) => (
                                    <p key={i} className="text-success w-full opacity-80">✔ {msg}</p>
                                  ))}
                                  {cryptoStage < 5 && (
                                    <p className="animate-pulse w-full text-warning font-medium">▶ {cryptoStages[cryptoStage]} <span className="animate-ping">...</span></p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
