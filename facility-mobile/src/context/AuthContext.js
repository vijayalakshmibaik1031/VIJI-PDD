import React, { createContext, useState, useContext } from 'react';
import { apiCall } from '../config/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = async (role, userId, password) => {
    setLoading(true);
    setError(null);
    try {
      let endpoint = '/employees/login';
      if (role === 'manager') endpoint = '/managers/login';
      else if (role === 'authority') endpoint = '/authorities/login';

      const data = await apiCall(endpoint, {
        method: 'POST',
        body: JSON.stringify({ userId: userId.trim(), password }),
      });

      if (data.needsPasswordReset) {
        setLoading(false);
        return { needsPasswordReset: true, role: data.role || role, userId: data.userId || userId, email: data.email || '' };
      }

      const userData = {
        id: data.session?.userId || data.user?.id || userId,
        userId: data.session?.userId || userId,
        name: data.session?.name || userId,
        role: data.session?.role || role,
        email: data.session?.email || '',
      };

      setUser(userData);
      setToken(data.token || 'authenticated-token');
      setLoading(false);
      return userData;
    } catch (err) {
      setError(err.message || 'Login failed');
      setLoading(false);
      throw err;
    }
  };

  const loginWithToken = (tokenStr, sessionObj) => {
    const userData = {
      id: sessionObj.userId || sessionObj.id,
      userId: sessionObj.userId || sessionObj.id,
      name: sessionObj.name || sessionObj.userId,
      role: sessionObj.role || 'employee',
      email: sessionObj.email || '',
      username: sessionObj.username || '',
    };
    setUser(userData);
    setToken(tokenStr);
  };

  const updateSession = (updatedFields) => {
    setUser((prev) => (prev ? { ...prev, ...updatedFields } : prev));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        loginWithToken,
        updateSession,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
