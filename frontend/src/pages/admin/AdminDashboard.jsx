import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/helpers';
import api from '../../services/api';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [users, setUsers] = useState({ students: [], teachers: [] });
  const [loading, setLoading] = useState(true);

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
        setUsers({
           students: usersRes.data.students || [],
           teachers: usersRes.data.teachers || []
        });
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

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-card p-4 sm:p-5 rounded-xl border border-border shadow-sm">
        <h1 className="text-lg sm:text-xl font-semibold text-text">System Administration</h1>
        <p className="text-xs sm:text-sm text-text-secondary mt-0.5 sm:mt-1">Global view of all cryptographic operations and system health.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
        <div className="bg-card rounded-xl border border-border p-3 sm:p-5 shadow-sm">
          <p className="text-[10px] sm:text-sm text-text-secondary mb-0.5 sm:mb-1">Total System Tasks</p>
          <p className="text-lg sm:text-2xl font-bold text-primary">{tasks.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-3 sm:p-5 shadow-sm">
          <p className="text-[10px] sm:text-sm text-text-secondary mb-0.5 sm:mb-1">Total Submissions</p>
          <p className="text-lg sm:text-2xl font-bold text-text">{submissions.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-3 sm:p-5 shadow-sm">
          <p className="text-[10px] sm:text-sm text-text-secondary mb-0.5 sm:mb-1">Registered Students</p>
          <p className="text-lg sm:text-2xl font-bold text-student">{users.students.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-3 sm:p-5 shadow-sm">
          <p className="text-[10px] sm:text-sm text-text-secondary mb-0.5 sm:mb-1">Registered Teachers</p>
          <p className="text-lg sm:text-2xl font-bold text-teacher">{users.teachers.length}</p>
        </div>
      </div>

      {/* Directory Table Area */}
      <div className="bg-card rounded-xl border border-border shadow-sm">
        <div className="p-4 border-b border-border">
            <h2 className="text-base font-semibold text-text">Global User Directory</h2>
        </div>

        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-bg/30">
                <th className="text-left py-3 px-5 text-xs font-semibold text-text-secondary uppercase">User</th>
                <th className="text-left py-3 px-5 text-xs font-semibold text-text-secondary uppercase">Email</th>
                <th className="text-left py-3 px-5 text-xs font-semibold text-text-secondary uppercase">Role / ID</th>
                <th className="text-left py-3 px-5 text-xs font-semibold text-text-secondary uppercase">Progress / Stats</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {/* Render Teachers first */}
              {users.teachers.map((t) => (
                <tr key={t.id} className="hover:bg-bg/50 transition-colors">
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-teacher/10 text-teacher flex items-center justify-center text-xs font-bold shrink-0">
                          {getInitials(t.name)}
                      </div>
                      <span className="text-sm text-text font-medium">{t.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-5 text-sm text-text-secondary">{t.email}</td>
                  <td className="py-3 px-5 text-sm text-text-secondary">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-teacher/10 text-teacher text-[10px] font-medium mr-2">Teacher</span>
                    <span className="font-mono text-text-secondary text-xs">{t.employee_id || 'N/A'}</span>
                  </td>
                  <td className="py-3 px-5">
                      <span className="text-xs text-text-secondary font-medium">Created {t.tasks_created} tasks, {t.submissions_received} subs</span>
                  </td>
                </tr>
              ))}
              {/* Render Students */}
              {users.students.map((s) => (
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
                  <td className="py-3 px-5 text-sm text-text-secondary">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-student/10 text-student text-[10px] font-medium mr-2">Student</span>
                    <span className="font-mono text-text-secondary text-xs">{s.student_id || 'N/A'}</span>
                  </td>
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
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="sm:hidden divide-y divide-border">
          {/* Teachers Mobile */}
          {users.teachers.map((t) => (
            <div key={t.id} className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-teacher/10 text-teacher flex items-center justify-center text-xs font-bold shrink-0">
                      {getInitials(t.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text truncate">{t.name}</p>
                    <p className="text-[10px] text-text-secondary truncate">{t.email}</p>
                  </div>
                  <span className="inline-block px-2 py-0.5 rounded-full bg-teacher/10 text-teacher text-[10px] font-medium">Teacher</span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-text-secondary">
                  <span>ID: {t.employee_id || 'N/A'}</span>
                  <span>{t.tasks_created} Tasks, {t.submissions_received} Subs</span>
                </div>
            </div>
          ))}
          {/* Students Mobile */}
          {users.students.map((s) => (
            <div key={s.id} className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-student/10 text-student flex items-center justify-center text-xs font-bold shrink-0">
                      {getInitials(s.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text truncate">{s.name}</p>
                    <p className="text-[10px] text-text-secondary truncate">{s.email}</p>
                  </div>
                  <span className="inline-block px-2 py-0.5 rounded-full bg-student/10 text-student text-[10px] font-medium">Student</span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-text-secondary">
                  <span>ID: {s.student_id || 'N/A'}</span>
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
          ))}
        </div>

      </div>
    </div>
  );
}
