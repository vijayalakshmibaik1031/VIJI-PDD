import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiService, setToken } from '../utils/apiService';

const SESSION_KEY = 'fd_session';
const AuthContext = createContext(null);

function loadSessionFromStorage() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(loadSessionFromStorage);
  const [error, setError] = useState(null);

  // Keep localStorage in sync with session state
  useEffect(() => {
    if (session) {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } else {
      window.localStorage.removeItem(SESSION_KEY);
    }
  }, [session]);

  const registerEmployee = async ({ id, name, password }) => {
    try {
      setError(null);
      await apiService.registerEmployee(id, name, password);
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Manager and authority registration is disabled — fixed system accounts only
  const registerManager = async () => {
    throw new Error('Manager registration is disabled');
  };
  const registerAuthority = async () => {
    throw new Error('Authority registration is disabled');
  };

  const login = async ({ role, userId, password }) => {
    try {
      setError(null);
      let response;

      if (role === 'employee') {
        response = await apiService.loginEmployee(userId, password);
      } else if (role === 'manager') {
        response = await apiService.loginManager(userId, password);
      } else if (role === 'authority') {
        response = await apiService.loginAuthority(userId, password);
      } else {
        throw new Error('Unknown role');
      }

      // Store the token so apiService can attach it to future requests
      setToken(response.token);

      const sessionData = response.session;
      setSession(sessionData);
      return sessionData;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const loginWithGoogle = async (credential) => {
    try {
      setError(null);
      const response = await apiService.loginWithGoogle(credential);
      setToken(response.token);
      const sessionData = response.session;
      setSession(sessionData);
      return sessionData;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    // Tell the server to invalidate the token
    await apiService.logout();
    // Clear token and session locally
    setToken(null);
    setSession(null);
    setError(null);
  };

  const value = useMemo(
    () => ({
      session,
      error,
      registerEmployee,
      registerManager,
      registerAuthority,
      login,
      loginWithGoogle,
      logout,
    }),
    [session, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
