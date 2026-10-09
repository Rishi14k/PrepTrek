import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('preptrack_theme') || 'light';
  });

  // Apply theme class to HTML element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('preptrack_theme', theme);
  }, [theme]);

  // Check current session
  const checkAuth = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data?.success && res.data.user) {
        setUser(res.data.user);
        if (res.data.user.themePreference && res.data.user.themePreference !== 'system') {
          setTheme(res.data.user.themePreference);
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data?.success) {
        if (res.data.token || res.data.accessToken) {
          localStorage.setItem('preptrack_token', res.data.token || res.data.accessToken);
        }
        setUser(res.data.user);
        toast.success(res.data.message || 'Logged in successfully!');
        return { success: true };
      }
    } catch (err) {
      const msg = err.customMessage || 'Login failed';
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  const register = async (userData) => {
    try {
      const res = await api.post('/auth/register', userData);
      if (res.data?.success) {
        if (res.data.token || res.data.accessToken) {
          localStorage.setItem('preptrack_token', res.data.token || res.data.accessToken);
        }
        setUser(res.data.user);
        toast.success(res.data.message || 'Account created successfully!');
        return { success: true };
      }
    } catch (err) {
      const msg = err.customMessage || 'Registration failed';
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('preptrack_token');
      setUser(null);
      toast.success('Logged out successfully.');
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (user) {
      api.patch('/users/me/preferences', { themePreference: nextTheme }).catch(() => {});
    }
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data?.user) {
        setUser(res.data.user);
      }
    } catch (err) {}
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
        theme,
        toggleTheme,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
