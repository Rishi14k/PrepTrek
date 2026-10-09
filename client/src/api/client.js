import axios from 'axios';

// Resolve API base URL dynamically for both local Vite proxy and deployed cloud backends (Render, Vercel)
const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    const cleanUrl = envUrl.replace(/\/$/, '');
    return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
  }
  return '/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Bearer token as fallback for cross-site cookie restrictions
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('preptrack_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Standardize error message extraction and manage auth state
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If receiving 401 on auth/me or other routes, remove stale local token
    if (error.response?.status === 401 && error.config?.url?.includes('/auth/me')) {
      localStorage.removeItem('preptrack_token');
    }

    const message =
      error.response?.data?.message ||
      error.response?.data?.errors?.[0]?.message ||
      error.message ||
      'An unexpected network error occurred.';

    return Promise.reject({
      ...error,
      customMessage: message,
    });
  }
);

export default api;
