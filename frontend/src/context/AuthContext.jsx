import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null);
  const [token, setToken]   = useState(null);
  const [role, setRole]     = useState(null);
  const [loading, setLoading] = useState(true);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const storedUser  = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');
      if (storedUser && storedToken) {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        setToken(storedToken);
        setRole(parsed?.role || null);
      }
    } catch (e) {
      // Corrupt localStorage → clear it
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    }
    setLoading(false);
  }, []);

  /**
   * Accepts BOTH call styles so old + new callers work:
   *   login(userData)                  → token expected inside userData
   *   login(userData, token, role)     → token and role passed separately
   *
   * After this returns:
   *   - `user`    → everything except token / refreshToken
   *   - `token`   → access token (used by ProtectedRoute + axios interceptor)
   *   - `role`    → "admin" | "staff" | "section_head" | "office_incharge"
   *   - localStorage has: token, refreshToken, user
   */
  const login = (userDataOrFirst, tokenParam, roleParam) => {
    if (!userDataOrFirst) return;

    // Shallow-copy so we don't mutate caller's object
    const merged = { ...userDataOrFirst };

    const accessToken  = tokenParam || merged.token;
    const refreshToken = merged.refreshToken;
    const resolvedRole = roleParam || merged.role || 'staff';

    // Strip token-like fields out of the "user" object (they live separately)
    delete merged.token;
    delete merged.refreshToken;

    setUser(merged);
    setToken(accessToken || null);
    setRole(resolvedRole);

    try {
      localStorage.setItem('user', JSON.stringify(merged));
      if (accessToken)   localStorage.setItem('token', accessToken);
      if (refreshToken)  localStorage.setItem('refreshToken', refreshToken);
    } catch (e) {
      console.warn('Could not persist auth to localStorage', e);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore — local clear is enough
    }
    setUser(null);
    setToken(null);
    setRole(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  };

  return (
    <AuthContext.Provider
      value={{ user, token, role, setUser, loading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);