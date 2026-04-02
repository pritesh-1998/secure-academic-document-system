import { useAuth } from '../../context/AuthContext';
import { mockTasks, mockSubmissions } from '../../data/mockData';
import { daysUntil, getUrgency, formatDate } from '../../utils/helpers';
import { Link } from 'react-router-dom';

export default function StudentDashboard() {
  const { user } = useAuth();

  // Get this student's submissions
  const mySubmissions = mockSubmissions.filter((s) => s.studentId === user.id);

  // Get tasks and figure out which are incomplete
  const submittedTaskIds = mySubmissions.map((s) => s.taskId);
  const incompleteTasks = mockTasks.filter((t) => !submittedTaskIds.includes(t.id));
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
    pending: 'text-warning bg-warning/10',
  };

  return (
    <div className="space-y-6">
      {/* Alert Bar */}
      <div className={`p-4 rounded-xl border ${alert.bg} flex items-center gap-3`}>
        <span className="text-xl">{alert.icon}</span>
        <p className={`text-sm font-medium ${alert.text}`}>{alert.message}</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-sm text-text-secondary mb-1">Total Tasks</p>
          <p className="text-2xl font-bold text-text">{mockTasks.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-sm text-text-secondary mb-1">Submitted</p>
          <p className="text-2xl font-bold text-success">{mySubmissions.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-sm text-text-secondary mb-1">Pending</p>
          <p className="text-2xl font-bold text-warning">{incompleteTasks.length}</p>
        </div>
      </div>

      {/* Upcoming Tasks */}
      <div className="bg-card rounded-xl border border-border">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text">Upcoming Assignments</h2>
          <Link
            to="/upload"
            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition-colors"
          >
            Upload Assignment
          </Link>
        </div>
        <div className="divide-y divide-border">
          {[...overdueTasks, ...upcomingTasks].length === 0 ? (
            <div className="p-8 text-center text-text-secondary text-sm">
              No pending assignments. Great job! 🎉
            </div>
          ) : (
            [...overdueTasks, ...upcomingTasks].map((task) => {
              const days = daysUntil(task.deadline);
              const urgency = getUrgency(days);
              return (
                <div key={task.id} className="p-5 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-text">{task.title}</h3>
                    <p className="text-sm text-text-secondary mt-0.5">
                      {task.teacherName} · Due {formatDate(task.deadline)}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-3 py-1 rounded-full ${urgencyStyles[urgency]}`}>
                    {days < 0 ? `${Math.abs(days)} days overdue` : days === 0 ? 'Due today' : `${days} days left`}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* My Submissions */}
      <div className="bg-card rounded-xl border border-border">
        <div className="p-5 border-b border-border">
          <h2 className="text-lg font-semibold text-text">My Submissions</h2>
        </div>
        {mySubmissions.length === 0 ? (
          <div className="p-8 text-center text-text-secondary text-sm">
            No submissions yet. Upload your first assignment!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-5 py-3">Assignment</th>
                  <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-5 py-3">File</th>
                  <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-5 py-3">Submitted</th>
                  <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {mySubmissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-bg/50 transition-colors">
                    <td className="px-5 py-3.5 text-sm text-text font-medium">{sub.taskTitle}</td>
                    <td className="px-5 py-3.5 text-sm text-text-secondary">{sub.fileName}</td>
                    <td className="px-5 py-3.5 text-sm text-text-secondary">{sub.submittedAt}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[sub.status]}`}>
                        {sub.status === 'verified' ? '🔒 Verified' : '⏳ Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
