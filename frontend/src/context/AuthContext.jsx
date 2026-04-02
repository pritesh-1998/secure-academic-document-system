import { createContext, useContext, useState } from 'react';
import { mockUsers } from '../data/mockData';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  // Mock login — checks against mockData
  const login = (email, password) => {
    const found = mockUsers.find(
      (u) => u.email === email && u.password === password
    );
    if (found) {
      const userData = { ...found };
      delete userData.password; // never store password in state
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return { success: true, user: userData };
    }
    return { success: false, message: 'Invalid email or password' };
  };

  // Mock register
  const register = (name, email, password, role) => {
    const exists = mockUsers.find((u) => u.email === email);
    if (exists) {
      return { success: false, message: 'Email already registered' };
    }
    const newUser = {
      id: mockUsers.length + 1,
      name,
      email,
      role,
      department: 'Unassigned',
      joinedDate: new Date().toISOString().split('T')[0],
      lastLogin: new Date().toLocaleString(),
    };
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
    return { success: true, user: newUser };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
