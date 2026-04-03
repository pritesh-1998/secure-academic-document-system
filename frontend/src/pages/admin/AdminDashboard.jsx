import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-6">
      <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
        <h1 className="text-xl font-semibold text-text">System Administration</h1>
        <p className="text-sm text-text-secondary mt-1">Global view of all cryptographic operations and system health.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <p className="text-sm text-text-secondary mb-1">Total System Tasks</p>
          <p className="text-2xl font-bold text-primary">{tasks.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <p className="text-sm text-text-secondary mb-1">Total System Submissions</p>
          <p className="text-2xl font-bold text-text">{submissions.length}</p>
        </div>
      </div>
    </div>
  );
}
