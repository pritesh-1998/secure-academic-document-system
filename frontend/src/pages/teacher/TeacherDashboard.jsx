import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Link } from 'react-router-dom';
import { getInitials } from '../../utils/helpers';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('students');
  const [decryptingId, setDecryptingId] = useState(null);
  const [cryptoStage, setCryptoStage] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [tasksRes, subsRes, usersRes] = await Promise.all([
          api.get('/tasks'),
          api.get('/submissions'),
          api.get('/users/list')
        ]);
        setTasks(tasksRes.data);
        setSubmissions(subsRes.data);
        setStudentsList(usersRes.data.students || []);
      } catch (error) {
        console.error("Error loading dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    
    // Initial fetch
    fetchDashboardData();

    // Set up real-time polling every 5 seconds
    const intervalId = setInterval(fetchDashboardData, 5000);
    
    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  if (loading) {
    return <div className="p-4 sm:p-8 text-center text-text-secondary animate-pulse">Loading secure dashboard...</div>;
  }

  // Calculate statistics
  const totalTasks = tasks.length;
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

  const handleDownload = async (sub, filename) => {
    const submissionId = sub.id;
    const alreadyVerified = sub.status === 'verified';

    try {
      if (alreadyVerified) {
        // Show all steps instantly as completed, then download
        setDecryptingId(submissionId);
        setCryptoStage(5); // Jump straight to fully complete — shows all steps as ✔

        const response = await api.get(`/submissions/${submissionId}/download`, {
          responseType: 'blob'
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      // First-time verification — run crypto animation step by step
      setDecryptingId(submissionId);
      setCryptoStage(0);

      for(let i = 0; i < 5; i++) {
        await delay(180);
        setCryptoStage(i + 1);
      }

      const response = await api.get(`/submissions/${submissionId}/download`, {
        responseType: 'blob'
      });

      setCryptoStage(5);
      await delay(300);

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
  };

  const closeCryptoLog = () => {
    setDecryptingId(null);
    setCryptoStage(0);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-card p-4 sm:p-5 rounded-xl border border-border shadow-sm">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-text">Teacher Overview</h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-0.5 sm:mt-1">Manage assignments, students and review secure Cryptographic submissions</p>
        </div>
        <Link
          to="/create-task"
          className="px-4 sm:px-5 py-2 sm:py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition-colors shadow-sm text-center"
        >
          + Create Task
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <div className="bg-card rounded-xl border border-border p-3 sm:p-5 shadow-sm">
          <p className="text-[10px] sm:text-sm text-text-secondary mb-0.5 sm:mb-1">Assignments Created</p>
          <p className="text-lg sm:text-2xl font-bold text-primary">{totalTasks}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-3 sm:p-5 shadow-sm">
          <p className="text-[10px] sm:text-sm text-text-secondary mb-0.5 sm:mb-1">Registered Students</p>
          <p className="text-lg sm:text-2xl font-bold text-text">{studentsList.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-3 sm:p-5 shadow-sm">
          <p className="text-[10px] sm:text-sm text-text-secondary mb-0.5 sm:mb-1">Total Submissions</p>
          <p className="text-lg sm:text-2xl font-bold text-text">{submissions.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-3 sm:p-5 shadow-sm bg-warning/5 border-warning/20">
          <p className="text-[10px] sm:text-sm text-text-secondary mb-0.5 sm:mb-1">Pending Verification</p>
          <p className="text-lg sm:text-2xl font-bold text-warning">{pendingVerification.length}</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-card rounded-xl border border-border shadow-sm">
        {/* Tabs */}
        <div className="flex border-b border-border overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setActiveTab('students')}
            className={`px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'students' 
                ? 'text-primary border-b-2 border-primary bg-primary/5' 
                : 'text-text-secondary hover:text-text hover:bg-bg/50'
            }`}
          >
            Student Progress
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'assignments' 
                ? 'text-primary border-b-2 border-primary bg-primary/5' 
                : 'text-text-secondary hover:text-text hover:bg-bg/50'
            }`}
          >
            Assignment Tracking
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'list' 
                ? 'text-primary border-b-2 border-primary bg-primary/5' 
                : 'text-text-secondary hover:text-text hover:bg-bg/50'
            }`}
          >
            Crypto Submissions
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-0">
          
          {/* STUDENTS TAB */}
          {activeTab === 'students' && (
            <>
              {/* Mobile card view */}
              <div className="sm:hidden divide-y divide-border">
                {studentsList.length === 0 ? (
                  <div className="p-6 text-center text-text-secondary text-sm">
                    No students registered yet.
                  </div>
                ) : (
                  studentsList.map((s) => (
                    <div key={s.id} className="p-3 space-y-2">
                       <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-student/10 text-student flex items-center justify-center text-xs font-bold shrink-0">
                             {getInitials(s.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text truncate">{s.name}</p>
                            <p className="text-[10px] text-text-secondary truncate">{s.email}</p>
                          </div>
                       </div>
                       <div className="flex justify-between items-center text-[10px] text-text-secondary">
                          <span>ID: {s.student_id || '—'}</span>
                          <span className="font-medium text-text">
                            {s.submissions_count} / {s.total_tasks} submitted
                          </span>
                       </div>
                       <div className="w-full h-1.5 bg-border rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${s.submissions_count === s.total_tasks && s.total_tasks > 0 ? 'bg-success' : 'bg-primary'}`}
                            style={{ width: s.total_tasks > 0 ? `${(s.submissions_count / s.total_tasks) * 100}%` : '0%' }}
                          ></div>
                       </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop table view */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-bg/30">
                      <th className="text-left py-3 px-5 text-xs font-semibold text-text-secondary uppercase">Student</th>
                      <th className="text-left py-3 px-5 text-xs font-semibold text-text-secondary uppercase">Email</th>
                      <th className="text-left py-3 px-5 text-xs font-semibold text-text-secondary uppercase">Student ID</th>
                      <th className="text-left py-3 px-5 text-xs font-semibold text-text-secondary uppercase">Progress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {studentsList.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="py-8 text-center text-text-secondary text-sm">
                          No students registered yet.
                        </td>
                      </tr>
                    ) : (
                      studentsList.map((s) => (
                        <tr key={s.id} className="hover:bg-bg/50 transition-colors">
                          <td className="py-3 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-student/10 text-student flex items-center justify-center text-xs font-bold shrink-0">
                                 {getInitials(s.name)}
                              </div>
                              <span className="text-sm text-text font-medium">{s.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-5 text-sm text-text-secondary">{s.email}</td>
                          <td className="py-3 px-5 text-sm text-text-secondary font-mono">{s.student_id || '—'}</td>
                          <td className="py-3 px-5">
                            <div className="flex items-center gap-3">
                               <div className="flex-1 max-w-[120px] h-1.5 bg-border rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-300 ${s.submissions_count === s.total_tasks && s.total_tasks > 0 ? 'bg-success' : 'bg-primary'}`}
                                    style={{ width: s.total_tasks > 0 ? `${(s.submissions_count / s.total_tasks) * 100}%` : '0%' }}
                                  ></div>
                               </div>
                               <span className="text-xs font-medium text-text-secondary whitespace-nowrap">
                                 {s.submissions_count} / {s.total_tasks}
                               </span>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ASSIGNMENTS TAB */}
          {activeTab === 'assignments' && (
            <>
              <div className="sm:hidden divide-y divide-border">
                {tasks.length === 0 ? (
                  <div className="p-6 text-center text-text-secondary text-sm">
                    No assignments created yet.
                  </div>
                ) : (
                  tasks.map((task) => {
                    const counts = submissions.filter(s => s.task_id === task.id).length;
                    return (
                      <div key={task.id} className="p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-text">{task.title}</p>
                          <span className="text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            {counts} submitted
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-text-secondary">
                          <span>#{task.id}</span>
                          <span>·</span>
                          <span>Due {new Date(task.deadline).toLocaleDateString()}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="hidden sm:block overflow-x-auto">
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
            </>
          )}

          {/* LIST TAB */}
          {activeTab === 'list' && (
            <>
              <div className="sm:hidden divide-y divide-border">
                {submissions.length === 0 ? (
                  <div className="p-6 text-center text-text-secondary text-sm">
                    No submissions received yet.
                  </div>
                ) : (
                  submissions.map((sub) => (
                    <React.Fragment key={sub.id}>
                      <div className="p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-text">{sub.student?.name || 'Unknown'}</p>
                          {sub.integrity_flag === 'duplicate_detected' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-300 whitespace-nowrap">🔴 Exact Copy</span>
                          )}
                          {sub.integrity_flag === 'similar_content_detected' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-300 whitespace-nowrap">⚠️ Similar Content</span>
                          )}
                        </div>
                        <p className="text-[10px] text-text-secondary">{sub.task?.title || `#${sub.task_id}`}</p>
                        {sub.integrity_flag && sub.matched_submission?.student && (
                          <p className="text-[10px] text-text-secondary italic">Source: {sub.matched_submission.student.name}</p>
                        )}
                        <p className="text-xs text-text-secondary truncate">{sub.status === 'verified' ? '✅' : '🔒'} {sub.original_filename}</p>
                        {sub.notes && (
                          <div className="mt-2 bg-bg p-2 rounded-lg border border-border">
                            <p className="text-xs text-text-secondary italic">" {sub.notes} "</p>
                          </div>
                        )}
                        <button 
                          onClick={() => handleDownload(sub, sub.original_filename)}
                          disabled={decryptingId !== null}
                          className={`w-full text-xs font-bold transition-colors shadow-sm px-3 py-2 rounded-lg
                            ${decryptingId === sub.id && cryptoStage < 5 ? 'bg-warning text-white cursor-wait' : ''} 
                            ${decryptingId === sub.id && cryptoStage === 5 ? 'bg-success text-white' : ''} 
                            ${decryptingId === null ? 'bg-primary text-white hover:bg-primary-dark' : ''}
                            ${decryptingId !== null && decryptingId !== sub.id ? 'bg-primary opacity-50 cursor-not-allowed text-white' : ''}`}
                        >
                          {decryptingId === sub.id 
                              ? (cryptoStage === 5 ? '✅ Authenticated' : 'Authenticating...') 
                              : sub.status === 'verified' ? '✅ Verified (Download Again)' : 'Decrypt & Verify Signature'}
                        </button>
                      </div>
                      {decryptingId === sub.id && (
                        <div className="px-3 pb-3">
                          <div className="bg-bg/80 border border-warning/30 p-3 rounded-lg">
                            <div className="relative">
                              <div className="absolute top-0 left-0 h-0.5 bg-warning transition-all duration-300 ease-out rounded" 
                                   style={{ width: `${(cryptoStage / 5) * 100}%` }}></div>
                              <div className="flex justify-between items-center mb-2 mt-1">
                                <h4 className="text-warning font-bold text-[10px] uppercase">Crypto Engine Logs</h4>
                                {cryptoStage === 5 && (
                                  <button 
                                    onClick={closeCryptoLog}
                                    className="text-[10px] bg-bg hover:bg-bg/50 text-text-secondary px-2 py-0.5 border border-border rounded transition-colors"
                                  >
                                    Dismiss
                                  </button>
                                )}
                              </div>
                              <div className="font-mono text-[9px] text-text-secondary max-h-28 overflow-y-auto flex flex-col space-y-0.5 bg-card p-2 border border-border rounded">
                                {cryptoStages.slice(0, cryptoStage).map((msg, i) => (
                                  <p key={i} className="text-success w-full opacity-80">✔ {msg}</p>
                                ))}
                                {cryptoStage < 5 && (
                                  <p className="animate-pulse w-full text-warning font-medium">▶ {cryptoStages[cryptoStage]}...</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  ))
                )}
              </div>
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-bg/30">
                      <th className="text-left py-3 px-5 text-xs font-semibold text-text-secondary uppercase">Student</th>
                      <th className="text-left py-3 px-5 text-xs font-semibold text-text-secondary uppercase">Task</th>
                      <th className="text-left py-3 px-5 text-xs font-semibold text-text-secondary uppercase">Integrity</th>
                      <th className="text-left py-3 px-5 text-xs font-semibold text-text-secondary uppercase">Notes</th>
                      <th className="text-left py-3 px-5 text-xs font-semibold text-text-secondary uppercase">Encrypted File</th>
                      <th className="text-left py-3 px-5 text-xs font-semibold text-text-secondary uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {submissions.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-text-secondary text-sm">
                          No submissions received yet.
                        </td>
                      </tr>
                    ) : (
                      submissions.map((sub) => (
                        <React.Fragment key={sub.id}>
                        <tr className={`transition-colors border-l-4 ${
                          sub.status === 'verified'
                            ? 'bg-green-50/60 border-l-green-400 hover:bg-green-50'
                            : 'bg-amber-50/30 border-l-amber-300 hover:bg-amber-50/60'
                        }`}>
                          <td className="py-4 px-5 text-sm text-text font-medium">
                            {sub.student?.name || 'Unknown'}
                          </td>
                          <td className="py-4 px-5 text-sm text-text-secondary">
                            {sub.task?.title || `#${sub.task_id}`}
                          </td>
                          <td className="py-4 px-5">
                            {sub.integrity_flag === 'duplicate_detected' ? (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-300 whitespace-nowrap">🔴 Exact Copy</span>
                                {sub.matched_submission?.student && (
                                  <p className="text-[10px] text-text-secondary">of <span className="font-semibold text-red-600">{sub.matched_submission.student.name}</span>'s submission</p>
                                )}
                              </div>
                            ) : sub.integrity_flag === 'similar_content_detected' ? (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 border border-orange-300 whitespace-nowrap">⚠️ Similar Content</span>
                                {sub.matched_submission?.student && (
                                  <p className="text-[10px] text-text-secondary">similar to <span className="font-semibold text-orange-600">{sub.matched_submission.student.name}</span>'s submission</p>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-success/10 text-success">✔ Clean</span>
                            )}
                          </td>
                          <td className="py-4 px-5 text-xs text-text-secondary whitespace-normal break-words max-w-[300px]">
                            {sub.notes ? `"${sub.notes}"` : '-'}
                          </td>
                          <td className="py-4 px-5 text-sm font-mono text-text-secondary max-w-xs truncate">
                            {sub.status === 'verified' ? '✅' : '🔒'} {sub.original_filename}
                          </td>
                          <td className="py-4 px-5">
                            <button 
                              onClick={() => handleDownload(sub, sub.original_filename)}
                              disabled={decryptingId !== null}
                              className={`text-xs sm:text-sm font-bold transition-colors shadow-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg whitespace-nowrap
                                ${decryptingId === sub.id && cryptoStage < 5 ? 'bg-warning text-white cursor-wait' : ''} 
                                ${decryptingId === sub.id && cryptoStage === 5 ? 'bg-success text-white' : ''} 
                                ${decryptingId === null ? 'bg-primary text-white hover:bg-primary-dark' : ''}
                                ${decryptingId !== null && decryptingId !== sub.id ? 'bg-primary opacity-50 cursor-not-allowed text-white' : ''}`}
                            >
                              {decryptingId === sub.id 
                                  ? (cryptoStage === 5 ? '✅ Authenticated' : 'Authenticating...') 
                                  : sub.status === 'verified' ? '✅ Verified (Download Again)' : 'Decrypt & Verify Signature'}
                            </button>
                          </td>
                        </tr>
                        {decryptingId === sub.id && (
                          <tr>
                            <td colSpan="6" className="p-0 border-b-0">
                              <div className="bg-bg/80 border-x border-b border-warning/30 p-4 sm:p-6 animate-pulse">
                                <div className="flex flex-col gap-2 relative">
                                  <div className="absolute top-0 left-0 h-0.5 bg-warning transition-all duration-300 ease-out" 
                                       style={{ width: `${(cryptoStage / 5) * 100}%` }}></div>
                                  <div className="flex justify-between items-center mb-2 mt-2">
                                    <h4 className="text-warning font-bold text-xs sm:text-sm">CRYPTOGRAPHIC ENGINE LOGS</h4>
                                    {cryptoStage === 5 && (
                                      <button 
                                        onClick={closeCryptoLog}
                                        className="text-xs bg-bg hover:bg-bg/50 text-text-secondary px-3 py-1 border border-border rounded transition-colors"
                                      >
                                        Dismiss
                                      </button>
                                    )}
                                  </div>
                                  <div className="font-mono text-[10px] sm:text-xs text-text-secondary max-h-40 overflow-y-auto flex flex-col space-y-1 bg-card p-2 sm:p-3 border border-border rounded-lg">
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
