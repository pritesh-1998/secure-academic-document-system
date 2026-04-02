import { useState } from 'react';
import { mockUsers, mockSubmissions, mockTasks } from '../../data/mockData';
import { maskEmail } from '../../utils/helpers';

export default function AdminDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const allUsers = mockUsers;

  // Filter users
  const filteredUsers = allUsers.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Stats
  const students = allUsers.filter((u) => u.role === 'student');
  const teachers = allUsers.filter((u) => u.role === 'teacher');

  const roleBadge = {
    student: 'bg-student/10 text-student',
    teacher: 'bg-teacher/10 text-teacher',
    admin: 'bg-admin/10 text-admin',
  };

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: allUsers.length, color: 'text-text' },
          { label: 'Students', value: students.length, color: 'text-student' },
          { label: 'Teachers', value: teachers.length, color: 'text-teacher' },
          { label: 'Total Documents', value: mockSubmissions.length, color: 'text-success' },
        ].map((stat) => (
          <div key={stat.label} className="bg-card rounded-xl border border-border p-5">
            <p className="text-sm text-text-secondary mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* User Management Table */}
      <div className="bg-card rounded-xl border border-border">
        <div className="p-5 border-b border-border">
          <h2 className="text-lg font-semibold text-text mb-4">User Management</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 rounded-lg border border-border bg-bg text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
            />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-border bg-bg text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="teacher">Teachers</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-5 py-3">User</th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-5 py-3">Email</th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-5 py-3">Role</th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-5 py-3">Department</th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-5 py-3">Joined</th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-5 py-3">Last Login</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-bg/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${roleBadge[u.role]}`}>
                        {u.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-sm font-medium text-text">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-text-secondary">{maskEmail(u.email)}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${roleBadge[u.role]}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-text-secondary">{u.department}</td>
                  <td className="px-5 py-3.5 text-sm text-text-secondary">{u.joinedDate}</td>
                  <td className="px-5 py-3.5 text-sm text-text-secondary">{u.lastLogin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assignment Overview — Similar to Teacher */}
      <div className="bg-card rounded-xl border border-border">
        <div className="p-5 border-b border-border">
          <h2 className="text-lg font-semibold text-text">Assignment Overview</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-5 py-3">Assignment</th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-5 py-3">Teacher</th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-5 py-3">Students</th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-5 py-3">Submitted</th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider px-5 py-3">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mockTasks.map((task) => {
                const percent = Math.round((task.submittedCount / task.totalStudents) * 100);
                return (
                  <tr key={task.id} className="hover:bg-bg/50 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-medium text-text">{task.title}</td>
                    <td className="px-5 py-3.5 text-sm text-text-secondary">{task.teacherName}</td>
                    <td className="px-5 py-3.5 text-sm text-text">{task.totalStudents}</td>
                    <td className="px-5 py-3.5 text-sm text-success font-medium">{task.submittedCount}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${percent}%` }} />
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
      </div>
    </div>
  );
}
