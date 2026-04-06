import { useAuth } from '../../context/AuthContext';

export default function Navbar({ title }) {
  const { user } = useAuth();

  return (
    <header className="bg-card border-b border-border px-4 sm:px-6 lg:px-8 py-3 lg:py-4 flex items-center justify-between">
      {/* Left spacer for mobile hamburger button */}
      <div className="flex items-center gap-3">
        <div className="lg:hidden w-10" />
        <h1 className="text-lg lg:text-xl font-semibold text-text">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs sm:text-sm text-text-secondary">
          Welcome, <span className="font-medium text-text">{user?.name?.split(' ')[0]}</span>
        </span>
      </div>
    </header>
  );
}
