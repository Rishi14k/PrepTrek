import axios from 'axios';

const api = axios.create({
  baseURL: 'https://preptrek.onrender.com/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Standardize error message extraction
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
