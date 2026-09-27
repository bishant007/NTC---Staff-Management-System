import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext(undefined);

// Lazy initializers: read localStorage on FIRST render (not after)
const readUser = () => {
  try {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  } catch { return null; }
};
const readToken = () => localStorage.getItem('token');
const readRole  = () => localStorage.getItem('role');

export const AuthProvider = ({ children }) => {
  const [user,  setUser]  = useState(readUser);
  const [token, setToken] = useState(readToken);
  const [role,  setRole]  = useState(readRole);

  const login = (userData, tokenValue, roleValue) => {
    setUser(userData);
    setToken(tokenValue);
    setRole(roleValue);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', tokenValue);
    localStorage.setItem('role', roleValue);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setRole(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
  };

  return (
    <AuthContext.Provider value={{ user, token, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const c = useContext(AuthContext);
  if (c === undefined) throw new Error('useAuth must be used within AuthProvider');
  return c;
};