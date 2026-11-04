import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore authenticated session on mount
  useEffect(() => {
    try {
      const storedToken = authService.getToken();
      const storedUser = authService.getCurrentUser();
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
      }
    } catch (e) {
      console.error('[AuthContext] Failed to restore session:', e);
      authService.logout();
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (identifier, password) => {
    setLoading(true);
    try {
      const { token: receivedToken, user: receivedUser } = await authService.login(identifier, password);
      setToken(receivedToken);
      setUser(receivedUser);
      return receivedUser;
    } finally {
      setLoading(false);
    }
  };

  const register = async ({ name, email, studentId, password, role }) => {
    setLoading(true);
    try {
      const { token: receivedToken, user: receivedUser } = await authService.register({
        name,
        email,
        studentId,
        password,
        role,
      });
      setToken(receivedToken);
      setUser(receivedUser);
      return receivedUser;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    role: user?.role || null,
    isAuthenticated: Boolean(token && user),
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
