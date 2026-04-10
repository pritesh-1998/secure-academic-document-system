import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/helpers';

// Icons as simple SVG components
const icons = {
  dashboard: (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  upload: (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  ),
  users: (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  tasks: (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  profile: (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  logout: (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  create: (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  menu: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  close: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
};

// Navigation items per role
const navItems = {
  student: [
    { to: '/dashboard', label: 'Dashboard', icon: icons.dashboard },
    { to: '/upload', label: 'Upload Assignment', icon: icons.upload },
    { to: '/profile', label: 'Profile', icon: icons.profile },
  ],
  teacher: [
    { to: '/dashboard', label: 'Dashboard', icon: icons.dashboard },
    { to: '/create-task', label: 'Create Task', icon: icons.create },
    { to: '/profile', label: 'Profile', icon: icons.profile },
  ],
  admin: [
    { to: '/dashboard', label: 'Dashboard', icon: icons.dashboard },
    { to: '/profile', label: 'Profile', icon: icons.profile },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const items = navItems[user?.role] || [];
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleBadgeColor = {
    student: 'bg-student',
    teacher: 'bg-teacher',
    admin: 'bg-admin',
  };

  const isTeacher = user?.role === 'teacher';
  const sidebarBg = isTeacher ? 'bg-[#1e1b4b]' : 'bg-sidebar';
  const sidebarHover = isTeacher ? 'hover:bg-[#312e81]' : 'hover:bg-sidebar-hover';
  const activeNavClass = isTeacher ? 'bg-[#4f46e5]' : 'bg-primary';
  const logoAccent = isTeacher ? 'bg-[#4f46e5]' : 'bg-primary';

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 ${logoAccent} rounded-lg flex items-center justify-center shrink-0`}>
              <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h2 className="text-white font-semibold text-sm leading-tight">SecureDoc</h2>
              <p className="text-white/50 text-[10px]">Academic System</p>
            </div>
          </div>
          {/* Close button on mobile */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-white/50 hover:text-white transition-colors p-1"
          >
            {icons.close}
          </button>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="p-2.5 space-y-0.5">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? `${activeNavClass} text-white`
                  : `text-white/70 ${sidebarHover} hover:text-white`
              }`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Spacer when no directory */}
      <div className="flex-1" />

      {/* User Info + Logout */}
      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-2.5 mb-2 px-1">
          <div className="w-7 h-7 rounded-full bg-primary-light flex items-center justify-center text-white text-[10px] font-semibold shrink-0">
            {getInitials(user?.name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{user?.name}</p>
            <span className={`inline-block text-[10px] text-white px-1.5 py-0.5 rounded-full ${roleBadgeColor[user?.role]}`}>
              {user?.role}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-white/70 hover:bg-red-500/20 hover:text-red-400 transition-colors w-full"
        >
          {icons.logout}
          Logout
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-50 bg-sidebar text-white p-2 rounded-lg shadow-lg hover:bg-sidebar-hover transition-colors"
      >
        {icons.menu}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        />
      )}

      {/* Desktop sidebar — always visible on lg+ */}
      <aside className={`hidden lg:flex w-52 ${sidebarBg} min-h-screen flex-col fixed left-0 top-0 z-30`}>
        {sidebarContent}
      </aside>

      {/* Mobile sidebar — slides in from the left */}
      <aside
        className={`lg:hidden fixed left-0 top-0 z-50 w-64 ${sidebarBg} min-h-screen flex flex-col transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
