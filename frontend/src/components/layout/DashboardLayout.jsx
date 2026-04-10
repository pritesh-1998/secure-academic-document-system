import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

// DashboardLayout wraps all authenticated pages
// It provides: fixed sidebar on left + navbar on top + scrollable content area

export default function DashboardLayout({ title }) {
  const { user } = useAuth();

  useEffect(() => {
    document.body.dataset.role = user?.role || '';
    return () => { document.body.dataset.role = ''; };
  }, [user?.role]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 lg:ml-52">
        <Navbar title={title} />
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
