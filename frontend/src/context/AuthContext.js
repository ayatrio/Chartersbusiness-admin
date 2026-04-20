import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

import api, { clearApiAuthToken, setApiAuthToken } from '../services/api';

const AuthContext = createContext(null);

const setSessionToken = (token) => {
  sessionStorage.setItem('token', token);
  setApiAuthToken(token);
};

const clearSessionToken = () => {
  sessionStorage.removeItem('token');
  clearApiAuthToken();
};

export const AuthProvider = ({ children }) => {
  const [applications, setApplications] = useState([]);
  const [counselings, setCounselings] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCodeExchanged, setIsCodeExchanged] = useState(false);

  // Decode JWT safely
  const decodeJwt = (token) => {
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;

      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);

      const jsonPayload = decodeURIComponent(
        atob(padded)
          .split('')
          .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
          .join('')
      );

      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  };

  const getSessionContext = useCallback((token) => {
    const decoded = decodeJwt(token);
    const isExpired = !decoded?.exp || decoded.exp * 1000 < Date.now();
    const isAdminToken = String(decoded?.tokenType || '').toLowerCase() === 'pb_admin';

    return {
      decoded,
      isAdminToken,
      isExpired,
    };
  }, []);

  // Fetch current user (admin route first, then candidate route)
  const fetchCurrentUser = useCallback(async (token) => {
    const activeToken = String(token || sessionStorage.getItem('token') || '').trim();
    if (!activeToken) {
      clearSessionToken();
      setUser(null);
      setLoading(false);
      return;
    }

    setApiAuthToken(activeToken);

    const { isAdminToken } = getSessionContext(activeToken);
    const primaryPath = isAdminToken ? '/admin/auth/me' : '/auth/me';
    const fallbackPath = isAdminToken ? '/auth/me' : '/admin/auth/me';

    try {
      const { data } = await api.get(primaryPath, { skipAuthRedirect: true });
      if (data?.user) {
        setUser(data.user);
        setLoading(false);
        return;
      }
    } catch (error) {
      const status = error?.response?.status;
      if (![401, 403, 404].includes(status)) {
        throw error;
      }
    }

    try {
      const { data } = await api.get(fallbackPath, { skipAuthRedirect: true });
      if (data?.user) {
        setUser(data.user);
        setLoading(false);
        return;
      }

      throw new Error('User payload missing from auth response');
    } catch {
      clearSessionToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [getSessionContext]);

  const exchangeCode = useCallback(async (code) => {
    try {
      const { data } = await api.post('/auth/exchange-code', { code });

      const responseData = data?.data || data;
      const token = responseData?.token;
      const userData = responseData?.user;

      if (token) {
        setSessionToken(token);
        if (userData) {
          setUser(userData);
          setLoading(false);
        } else {
          await fetchCurrentUser(token);
        }
      }

      setIsCodeExchanged(true);
      return data;
    } catch (error) {
      console.error('Code exchange failed:', error);
      throw error;
    }
  }, [fetchCurrentUser]);

  // Initial session restore
  useEffect(() => {
    const token = sessionStorage.getItem('token');
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (!token) {
      // If there's no token and no code to exchange, we're definitely not logged in
      if (!code) {
        setLoading(false);
      }
      return;
    }

    try {
      const { decoded, isExpired } = getSessionContext(token);

      // Invalid or expired token
      if (!decoded || isExpired) {
        clearSessionToken();
        setLoading(false);
        return;
      }

      setApiAuthToken(token);
      fetchCurrentUser(token);
    } catch {
      clearSessionToken();
      setLoading(false);
    }
  }, [fetchCurrentUser, getSessionContext]);

  // Detect server restart (optional safety)
  useEffect(() => {
    const checkServer = async () => {
      try {
        const { data } = await api.get('/health');

        const serverStart = data?.serverStart;
        const prev = sessionStorage.getItem('serverStart');

        if (prev && prev !== serverStart) {
          clearSessionToken();
          setUser(null);
        }

        if (serverStart) {
          sessionStorage.setItem('serverStart', serverStart);
        }
      } catch {
        // ignore
      }
    };

    checkServer();
  }, []);

  // Handle automatic code exchange if 'code' is present in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (code && !isCodeExchanged) {
      exchangeCode(code)
        .catch((err) => {
          console.error('Auto code exchange failed:', err);
          setLoading(false); // Ensure loading stops even on failure
        });

      // Optional: Clean up URL after capturing the code
      const newUrl = window.location.pathname + window.location.search.replace(/[?&]code=[^&]+/, '').replace(/^&/, '?');
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [exchangeCode, isCodeExchanged]);

  // LOGIN
  const login = async (email, password) => {
    // Candidate login first keeps regular users independent from admin-upstream availability.
    let candidateError = null;
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setSessionToken(data.token);
      setUser(data.user);
      return data;
    } catch (error) {
      candidateError = error;
      const status = error?.response?.status;
      // Non-auth failures should surface immediately.
      if (![401, 403].includes(status)) {
        throw error;
      }
    }

    // Candidate auth failed -> try admin validation path.
    try {
      const adminRes = await api.post('/admin/auth/login', { email, password });
      if (adminRes?.data?.token && adminRes?.data?.user) {
        setSessionToken(adminRes.data.token);
        setUser(adminRes.data.user);
        return adminRes.data;
      }

      throw candidateError;
    } catch (adminError) {
      const adminStatus = adminError?.response?.status;
      if ([404, 429, 500, 502, 503, 504].includes(adminStatus)) {
        const combinedError = new Error(
          'Candidate credentials are invalid, and admin login validation is currently unavailable. Please try again shortly.'
        );
        combinedError.response = adminError?.response;
        throw combinedError;
      }

      throw adminError;
    }
  };

  // REGISTER
  const register = async (formData) => {
    const { data } = await api.post('/auth/register', formData);

    setSessionToken(data.token);
    setUser(data.user);

    return data;
  };

  // LOGOUT
  const logout = () => {
    clearSessionToken();
    setUser(null);
  };

  // Update user manually (after profile edit etc.)
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const refreshApplications = useCallback(async () => {
    const token = sessionStorage.getItem('token');
    if (!token) return;
    try {
      const { data } = await api.get('/applications/user');
      if (data?.data) setApplications(data.data);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  }, []);

  const refreshCounselings = useCallback(async () => {
    const token = sessionStorage.getItem('token');
    if (!token) return;
    try {
      const { data } = await api.get('/counseling/user');
      if (data?.data) setCounselings(data.data);
    } catch (error) {
      console.error('Error fetching counselings:', error);
    }
  }, []);

  const generateRedirectCode = async () => {
    try {
      const { data } = await api.post('/auth/redirect-code');
      return data?.data?.code || null;
    } catch (error) {
      console.error('Failed to generate redirect code:', error);
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
        register,
        logout,
        updateUser,
        applications,
        counselings,
        refreshApplications,
        refreshCounselings,
        exchangeCode,
        isCodeExchanged,
        generateRedirectCode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
