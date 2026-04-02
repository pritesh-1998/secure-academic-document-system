import { useState } from 'react';
import { mockTasks, mockSubmissions, mockUsers } from '../../data/mockData';
import { formatDate, maskEmail } from '../../utils/helpers';
import { Link } from 'react-router-dom';

export default function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState('assignments');

  const students = mockUsers.filter((u) => u.role === 'student');

  // Stats
  const totalStudents = students.length;
  const totalAssignments = mockTasks.length;
  const totalSubmissions = mockSubmissions.length;
  const pendingReviews = mockSubmissions.filter((s) => s.status === 'pending').length;

  const tabClass = (tab) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      activeTab === tab
        ? 'bg-primary text-white'
        : 'text-text-secondary hover:bg-bg'
    }`;

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Students', value: totalStudents, color: 'text-student' },
          { label: 'Assignments Created', value: totalAssignments, color: 'text-teacher' },
          { label: 'Submissions Received', value: totalSubmissions, color: 'text-success' },
          { label: 'Pending Reviews', value: pendingReviews, color: 'text-warning' },
        ].map((stat) => (
          <div key={stat.label} className="bg-card rounded-xl border border-border p-5">
            <p className="text-sm text-text-secondary mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-card rounded-xl border border-border">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div className="flex gap-2">
            <button onClick={() => setActiveTab('assignments')} className={tabClass('assignments')}>
              Assignment Tracking
            </button>
            <button onClick={() => setActiveTab('students')} className={tabClass('students')}>
              Student List
            </button>
          </div>
          <Link
            to="/create-task"
            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition-colors"
          >
            + Create Task
          </Link>
        </div>

        {/* Assignment Tracking Table */}
        {activeTab === 'assignments' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-5 py-3">Assignment</th>
                  <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-5 py-3">Due Date</th>
                  <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-5 py-3">Students</th>
                  <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-5 py-3">Submitted</th>
                  <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-5 py-3">Pending</th>
                  <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-5 py-3">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {mockTasks.map((task) => {
                  const submitted = task.submittedCount;
                  const total = task.totalStudents;
                  const pending = total - submitted;
                  const percent = Math.round((submitted / total) * 100);
                  return (
                    <tr key={task.id} className="hover:bg-bg/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-text">{task.title}</p>
                        <p className="text-xs text-text-secondary mt-0.5">{task.description.slice(0, 60)}...</p>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-text-secondary">{formatDate(task.deadline)}</td>
                      <td className="px-5 py-3.5 text-sm text-text font-medium">{total}</td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-medium text-success">{submitted}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-medium text-warning">{pending}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-text-secondary w-10">{percent}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Student List Table */}
        {activeTab === 'students' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-5 py-3">Student</th>
                  <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-5 py-3">Email</th>
                  <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-5 py-3">Department</th>
                  <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-5 py-3">Submissions</th>
                  <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-5 py-3">Last Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {students.map((student) => {
                  const studentSubs = mockSubmissions.filter((s) => s.studentId === student.id);
                  return (
                    <tr key={student.id} className="hover:bg-bg/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-student/10 text-student flex items-center justify-center text-xs font-semibold">
                            {student.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="text-sm font-medium text-text">{student.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-text-secondary">{maskEmail(student.email)}</td>
                      <td className="px-5 py-3.5 text-sm text-text-secondary">{student.department}</td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-medium text-text">
                          {studentSubs.length}/{mockTasks.length}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-text-secondary">{student.lastLogin}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
