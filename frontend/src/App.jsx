import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/guards/ProtectedRoute';
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import PasswordReset from './pages/auth/PasswordReset';

// Dashboard pages
import StudentDashboard from './pages/student/StudentDashboard';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';

// Feature pages
import UploadAssignment from './pages/student/UploadAssignment';
import CreateTask from './pages/teacher/CreateTask';
import Profile from './pages/shared/Profile';

// Dashboard router — renders the right dashboard based on user role
function DashboardRouter() {
  const { user } = useAuth();
  switch (user?.role) {
    case 'student':
      return <StudentDashboard />;
    case 'teacher':
      return <TeacherDashboard />;
    case 'admin':
      return <AdminDashboard />;
    default:
      return <Navigate to="/login" />;
  }
}

// Gets page title based on current path
function getPageTitle(pathname) {
  const titles = {
    '/dashboard': 'Dashboard',
    '/upload': 'Upload Assignment',
    '/students': 'Student List',
    '/create-task': 'Create Task',
    '/users': 'User Management',
    '/profile': 'My Profile',
  };
  return titles[pathname] || 'Dashboard';
}

// Layout wrapper for authenticated pages
function DashLayout({ children }) {
  const pathname = window.location.pathname;
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Navbar title={getPageTitle(pathname)} />
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}

// Wrap a page component with the dashboard layout + route protection
function ProtectedPage({ children, allowedRoles }) {
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <DashLayout>{children}</DashLayout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<PasswordReset />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={<ProtectedPage><DashboardRouter /></ProtectedPage>} />
          <Route path="/upload" element={<ProtectedPage allowedRoles={['student']}><UploadAssignment /></ProtectedPage>} />
          <Route path="/students" element={<ProtectedPage allowedRoles={['teacher']}><TeacherDashboard /></ProtectedPage>} />
          <Route path="/create-task" element={<ProtectedPage allowedRoles={['teacher']}><CreateTask /></ProtectedPage>} />
          <Route path="/users" element={<ProtectedPage allowedRoles={['admin']}><AdminDashboard /></ProtectedPage>} />
          <Route path="/profile" element={<ProtectedPage><Profile /></ProtectedPage>} />

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
