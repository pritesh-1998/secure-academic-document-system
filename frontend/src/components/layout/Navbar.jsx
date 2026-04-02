import { useAuth } from '../../context/AuthContext';

export default function Navbar({ title }) {
  const { user } = useAuth();

  return (
    <header className="bg-card border-b border-border px-8 py-4 flex items-center justify-between">
      <h1 className="text-xl font-semibold text-text">{title}</h1>
      <div className="flex items-center gap-4">
        <span className="text-sm text-text-secondary">
          Welcome, <span className="font-medium text-text">{user?.name?.split(' ')[0]}</span>
        </span>
      </div>
    </header>
  );
}
