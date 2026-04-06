import React, { createContext, useContext, useState, useEffect } from 'react';
// Avoid importing `jwt-decode` to prevent bundler default-export issues.
// Use a small local JWT payload parser instead.
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount: restore session from localStorage
  // Robust JWT decode helper that works across module interop differences
  const decodeJwt = (token) => {
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;
      // base64 url -> base64
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
      const jsonPayload = decodeURIComponent(atob(padded).split('').map((c) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    // Prefer sessionStorage (cleared on tab close). If no session token exists
    // but an old token is present in localStorage, remove it so clients don't
    // appear logged in without an active session.
    const sessionToken = sessionStorage.getItem('token');
    const localToken = localStorage.getItem('token');

    if (sessionToken) {
      try {
        const decoded = decodeJwt(sessionToken);
        // Check expiry
        if (!decoded || !decoded.exp || decoded.exp * 1000 < Date.now()) {
          sessionStorage.removeItem('token');
        } else {
          api.defaults.headers.common['Authorization'] = `Bearer ${sessionToken}`;
          fetchCurrentUser();
          return;
        }
      } catch {
        sessionStorage.removeItem('token');
      }
    } else if (localToken) {
      // Explicitly remove stale persistent tokens to avoid showing a token
      // when the user hasn't logged in in this tab.
      try {
        localStorage.removeItem('token');
      } catch (e) {
        // ignore errors
      }
    }

    setLoading(false);
  }, []);

  // Detect server restart and clear token if server was restarted
  useEffect(() => {
    const checkServer = async () => {
      try {
        const { data } = await api.get('/health');
        const serverStart = data?.serverStart;
        if (serverStart) {
          const prev = sessionStorage.getItem('serverStart') || localStorage.getItem('serverStart');
          if (prev && prev !== serverStart) {
            // server restarted — clear tokens
            sessionStorage.removeItem('token');
            localStorage.removeItem('token');
            delete api.defaults.headers.common['Authorization'];
            setUser(null);
          }
          sessionStorage.setItem('serverStart', serverStart);
        }
      } catch (e) {
        // ignore
      }
    };

    checkServer();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
    } catch {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    // store token in sessionStorage so it's cleared when the tab is closed
    sessionStorage.setItem('token', data.token);
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setUser(data.user);
    return data;
  };

  const register = async (formData) => {
    const { data } = await api.post('/auth/register', formData);
    sessionStorage.setItem('token', data.token);
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setUser(data.user);
    return data;
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  // Ensure token is removed when the tab is closed
  useEffect(() => {
    const handleUnload = () => {
      try {
        sessionStorage.removeItem('token');
      } catch {}
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  const updateUser = (updatedUser) => setUser(updatedUser);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
