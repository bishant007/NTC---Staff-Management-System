import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const u = localStorage.getItem('user');
    const t = localStorage.getItem('token');
    const r = localStorage.getItem('role');
    if (u && t && r) { setUser(JSON.parse(u)); setToken(t); setRole(r); }
  }, []);

  const login = (userData, token, role) => {
    localStorage.removeItem('user'); localStorage.removeItem('token'); localStorage.removeItem('role');
    setUser(userData); setToken(token); setRole(role);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
  };

  const logout = () => {
    setUser(null); setToken(null); setRole(null);
    localStorage.removeItem('user'); localStorage.removeItem('token'); localStorage.removeItem('role');
  };

  return <AuthContext.Provider value={{ user, token, role, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const c = useContext(AuthContext);
  if (c === undefined) throw new Error('useAuth must be used within AuthProvider');
  return c;
};