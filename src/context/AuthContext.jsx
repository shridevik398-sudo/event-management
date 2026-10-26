import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

// Hardcoded demo credentials (frontend-only mock)
// TODO: Replace with a real authentication service
const DEMO_CREDENTIALS = {
  username: 'admin',
  password: 'admin123',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('ef_auth');
    return stored ? JSON.parse(stored) : null;
  });

  const login = (username, password) => {
    if (username === DEMO_CREDENTIALS.username && password === DEMO_CREDENTIALS.password) {
      const userData = { username, role: 'admin', loggedInAt: new Date().toISOString() };
      setUser(userData);
      localStorage.setItem('ef_auth', JSON.stringify(userData));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ef_auth');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
