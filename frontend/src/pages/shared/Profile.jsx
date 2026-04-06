import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { maskEmail, maskPhone, formatDate } from '../../utils/helpers';

export default function Profile() {
  const { user } = useAuth();
  const [showEmail, setShowEmail] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: user?.name || '',
    department: user?.department || '',
  });

  const handleSave = () => {
    setEditing(false);
    alert('Profile updated successfully!');
  };

  const roleBadge = {
    student: 'bg-student/10 text-student',
    teacher: 'bg-teacher/10 text-teacher',
    admin: 'bg-admin/10 text-admin',
  };

  const toggleReveal = (field) => {
    if (field === 'email') {
      setShowEmail(true);
      setTimeout(() => setShowEmail(false), 10000);
    } else if (field === 'phone') {
      setShowPhone(true);
      setTimeout(() => setShowPhone(false), 10000);
    }
  };

  const EyeIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
      {/* Profile Header */}
      <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-5">
          <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold shrink-0 ${roleBadge[user?.role]}`}>
            {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-lg sm:text-xl font-semibold text-text">{user?.name}</h2>
            <span className={`inline-block text-[10px] sm:text-xs font-medium px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full capitalize mt-1 ${roleBadge[user?.role]}`}>
              {user?.role}
            </span>
            <p className="text-xs sm:text-sm text-text-secondary mt-1">{user?.department}</p>
          </div>
          <button
            onClick={() => setEditing(!editing)}
            className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium border border-border rounded-lg hover:bg-bg transition-colors text-text w-full sm:w-auto"
          >
            {editing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
      </div>

      {/* Profile Details */}
      <div className="bg-card rounded-xl border border-border">
        <div className="p-4 sm:p-5 border-b border-border">
          <h3 className="text-base sm:text-lg font-semibold text-text">Personal Information</h3>
          <p className="text-[10px] sm:text-xs text-text-secondary mt-0.5">
            Sensitive details are hidden by default. Click the eye icon to reveal temporarily.
          </p>
        </div>
        <div className="divide-y divide-border">
          {/* Name */}
          <div className="px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] sm:text-xs text-text-secondary uppercase tracking-wide">Full Name</p>
              {editing ? (
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="mt-1 w-full px-3 py-1.5 rounded-lg border border-border bg-bg text-text text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              ) : (
                <p className="text-xs sm:text-sm font-medium text-text mt-0.5">{user?.name}</p>
              )}
            </div>
          </div>

          {/* Email — Masked */}
          <div className="px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] sm:text-xs text-text-secondary uppercase tracking-wide">Email</p>
              <p className="text-xs sm:text-sm font-medium text-text mt-0.5 truncate">
                {showEmail ? user?.email : maskEmail(user?.email)}
              </p>
            </div>
            <button
              onClick={() => toggleReveal('email')}
              className="p-1.5 sm:p-2 text-text-secondary hover:text-primary transition-colors rounded-lg hover:bg-bg shrink-0"
              title="Reveal email (hides after 10s)"
            >
              <EyeIcon />
            </button>
          </div>

          {/* Phone — Masked */}
          <div className="px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] sm:text-xs text-text-secondary uppercase tracking-wide">Phone</p>
              <p className="text-xs sm:text-sm font-medium text-text mt-0.5">
                {showPhone ? user?.phone : maskPhone(user?.phone)}
              </p>
            </div>
            <button
              onClick={() => toggleReveal('phone')}
              className="p-1.5 sm:p-2 text-text-secondary hover:text-primary transition-colors rounded-lg hover:bg-bg shrink-0"
              title="Reveal phone (hides after 10s)"
            >
              <EyeIcon />
            </button>
          </div>

          {/* Role */}
          <div className="px-4 sm:px-5 py-3 sm:py-4">
            <p className="text-[10px] sm:text-xs text-text-secondary uppercase tracking-wide">Role</p>
            <p className="text-xs sm:text-sm font-medium text-text mt-0.5 capitalize">{user?.role}</p>
          </div>

          {/* ID */}
          <div className="px-4 sm:px-5 py-3 sm:py-4">
            <p className="text-[10px] sm:text-xs text-text-secondary uppercase tracking-wide">
              {user?.role === 'student' ? 'Student ID' : 'Employee ID'}
            </p>
            <p className="text-xs sm:text-sm font-medium text-text mt-0.5">
              {user?.studentId || user?.employeeId || 'N/A'}
            </p>
          </div>

          {/* Department */}
          <div className="px-4 sm:px-5 py-3 sm:py-4">
            <p className="text-[10px] sm:text-xs text-text-secondary uppercase tracking-wide">Department</p>
            {editing ? (
              <input
                type="text"
                value={editData.department}
                onChange={(e) => setEditData({ ...editData, department: e.target.value })}
                className="mt-1 w-full px-3 py-1.5 rounded-lg border border-border bg-bg text-text text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            ) : (
              <p className="text-xs sm:text-sm font-medium text-text mt-0.5">{user?.department}</p>
            )}
          </div>

          {/* Joined Date */}
          <div className="px-4 sm:px-5 py-3 sm:py-4">
            <p className="text-[10px] sm:text-xs text-text-secondary uppercase tracking-wide">Joined</p>
            <p className="text-xs sm:text-sm font-medium text-text mt-0.5">{formatDate(user?.joinedDate)}</p>
          </div>

          {/* Last Login */}
          <div className="px-4 sm:px-5 py-3 sm:py-4">
            <p className="text-[10px] sm:text-xs text-text-secondary uppercase tracking-wide">Last Login</p>
            <p className="text-xs sm:text-sm font-medium text-text mt-0.5">{user?.lastLogin}</p>
          </div>
        </div>

        {editing && (
          <div className="p-4 sm:p-5 border-t border-border">
            <button
              onClick={handleSave}
              className="w-full sm:w-auto px-5 sm:px-6 py-2 sm:py-2.5 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors text-xs sm:text-sm"
            >
              Save Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
