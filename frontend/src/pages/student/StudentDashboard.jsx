import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { daysUntil, getUrgency, formatDate } from '../../utils/helpers';
import { Link } from 'react-router-dom';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this submission? This action cannot be undone.')) return;
    try {
      await api.delete(`/submissions/${id}`);
      setSubmissions(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to remove submission.');
    } finally {
      setDeletingId(null);
    }
  };

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
    return <div className="p-4 sm:p-8 text-center text-text-secondary animate-pulse">Loading secure dashboard...</div>;
  }

  // Get tasks and figure out which are incomplete
  const submittedTaskIds = submissions.map((s) => s.task_id);
  const incompleteTasks = tasks.filter((t) => !submittedTaskIds.includes(t.id));
  const overdueTasks = incompleteTasks.filter((t) => daysUntil(t.deadline) < 0);
  const upcomingTasks = incompleteTasks.filter((t) => daysUntil(t.deadline) >= 0);

  // Alert bar logic
  const getAlertConfig = () => {
    if (overdueTasks.length > 0) {
      return {
        bg: 'bg-danger/10 border-danger/20',
        text: 'text-danger',
        icon: '🔴',
        message: `You have ${overdueTasks.length} overdue assignment${overdueTasks.length > 1 ? 's' : ''}!`,
      };
    }
    if (incompleteTasks.length > 0) {
      return {
        bg: 'bg-warning/10 border-warning/20',
        text: 'text-warning',
        icon: '🟡',
        message: `${incompleteTasks.length} assignment${incompleteTasks.length > 1 ? 's' : ''} pending submission`,
      };
    }
    return {
      bg: 'bg-success/10 border-success/20',
      text: 'text-success',
      icon: '🟢',
      message: "You're all caught up! No pending assignments.",
    };
  };

  const alert = getAlertConfig();

  const urgencyStyles = {
    overdue: 'text-danger bg-danger/10',
    danger: 'text-danger bg-danger/10',
    warning: 'text-warning bg-warning/10',
    safe: 'text-success bg-success/10',
  };

  const statusStyles = {
    verified: 'text-success bg-success/10',
    submitted: 'text-success bg-success/10',
    uploaded: 'text-warning bg-warning/10',
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Alert Bar */}
      <div className={`p-3 sm:p-4 rounded-xl border ${alert.bg} flex items-center gap-2 sm:gap-3 shadow-sm`}>
        <span className="text-lg sm:text-xl">{alert.icon}</span>
        <p className={`text-xs sm:text-sm font-medium ${alert.text}`}>{alert.message}</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-card rounded-xl border border-border p-3 sm:p-5 shadow-sm">
          <p className="text-[10px] sm:text-sm text-text-secondary mb-0.5 sm:mb-1">Total Tasks</p>
          <p className="text-lg sm:text-2xl font-bold text-text">{tasks.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-3 sm:p-5 shadow-sm">
          <p className="text-[10px] sm:text-sm text-text-secondary mb-0.5 sm:mb-1">Submitted</p>
          <p className="text-lg sm:text-2xl font-bold text-success">{submissions.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-3 sm:p-5 shadow-sm">
          <p className="text-[10px] sm:text-sm text-text-secondary mb-0.5 sm:mb-1">Pending</p>
          <p className="text-lg sm:text-2xl font-bold text-warning">{incompleteTasks.length}</p>
        </div>
      </div>

      {/* Upcoming Tasks */}
      <div className="bg-card rounded-xl border border-border shadow-sm">
        <div className="p-3 sm:p-5 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
          <h2 className="text-base sm:text-lg font-semibold text-text">Upcoming Assignments</h2>
          <Link
            to="/upload"
            className="px-3 sm:px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs sm:text-sm font-medium rounded-lg transition-colors shadow-sm text-center"
          >
            Upload Assignment
          </Link>
        </div>
        <div className="divide-y divide-border">
          {[...overdueTasks, ...upcomingTasks].length === 0 ? (
            <div className="p-6 sm:p-8 text-center text-text-secondary text-sm">
              No pending assignments. Great job! 🎉
            </div>
          ) : (
            [...overdueTasks, ...upcomingTasks].map((task) => {
              const days = daysUntil(task.deadline);
              const urgency = getUrgency(days);
              return (
                <div key={task.id} className="p-3 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 hover:bg-bg/50 transition-colors">
                  <div>
                    <h3 className="font-medium text-text text-sm sm:text-base">{task.title}</h3>
                    <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
                      {task.teacher?.name || 'Teacher'} · Due {formatDate(task.deadline)}
                    </p>
                  </div>
                  <span className={`text-[10px] sm:text-xs font-medium px-2 sm:px-3 py-0.5 sm:py-1 rounded-full self-start sm:self-auto ${urgencyStyles[urgency]}`}>
                    {days < 0 ? `${Math.abs(days)} days overdue` : days === 0 ? 'Due today' : `${days} days left`}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* My Submissions */}
      <div className="bg-card rounded-xl border border-border shadow-sm">
        <div className="p-3 sm:p-5 border-b border-border">
          <h2 className="text-base sm:text-lg font-semibold text-text">Cryptographic Submissions</h2>
        </div>
        {submissions.length === 0 ? (
          <div className="p-6 sm:p-8 text-center text-text-secondary text-sm">
            No secure submissions yet. Upload your first assignment!
          </div>
        ) : (
          <>
            {/* Mobile card view */}
            <div className="sm:hidden divide-y divide-border">
              {submissions.map((sub) => (
                <div key={sub.id} className="p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-text">{sub.task?.title || `#${sub.task_id}`}</p>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusStyles[sub.status] || statusStyles.uploaded}`}>
                      {sub.status === 'verified' ? '✅ Verified by Teacher' : sub.status === 'submitted' ? '🔒 Encrypted' : '⏳ Pending'}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary truncate">{sub.original_filename}</p>
                  <p className="text-[10px] text-text-secondary">{new Date(sub.created_at).toLocaleDateString()}</p>
                  {sub.integrity_flag === 'duplicate_detected' && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 border border-orange-200">⚠️ Under Review</span>
                  )}
                  {sub.notes && (
                    <div className="mt-2 bg-bg p-2 rounded-lg border border-border">
                      <p className="text-xs text-text-secondary italic">" {sub.notes} "</p>
                    </div>
                  )}
                  {sub.status !== 'verified' && (
                    <button
                      onClick={() => handleDelete(sub.id)}
                      className="w-full mt-1 text-xs font-medium py-1.5 rounded-lg border border-danger/30 text-danger hover:bg-danger/10 transition-colors"
                    >
                      🗑 Remove Submission
                    </button>
                  )}
                </div>
              ))}
            </div>
            {/* Desktop table view */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-5 py-3">Task ID</th>
                    <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-5 py-3">File</th>
                    <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-5 py-3">Date</th>
                    <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-5 py-3">Notes</th>
                    <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-5 py-3">Status</th>
                    <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-5 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {submissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-bg/50 transition-colors">
                      <td className="px-5 py-3.5 text-sm text-text font-medium">{sub.task?.title || `#${sub.task_id}`}</td>
                      <td className="px-5 py-3.5 text-sm text-text-secondary">{sub.original_filename}</td>
                      <td className="px-5 py-3.5 text-sm text-text-secondary">{new Date(sub.created_at).toLocaleDateString()}</td>
                      <td className="px-5 py-3.5 text-xs text-text-secondary whitespace-normal break-words max-w-[300px] italic">
                        {sub.notes ? `"${sub.notes}"` : '-'}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col gap-1">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full self-start ${statusStyles[sub.status] || statusStyles.uploaded}`}>
                            {sub.status === 'verified' ? '✅ Verified by Teacher' : sub.status === 'submitted' ? '🔒 AES Encrypted' : '⏳ Pending'}
                          </span>
                          {sub.integrity_flag === 'duplicate_detected' && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 border border-orange-200 self-start">⚠️ Under Review</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {sub.status !== 'verified' ? (
                          <button
                            onClick={() => handleDelete(sub.id)}
                            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-danger/30 text-danger hover:bg-danger/10 transition-colors whitespace-nowrap"
                          >
                            🗑 Remove
                          </button>
                        ) : (
                          <span className="text-xs text-text-secondary">Locked</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
