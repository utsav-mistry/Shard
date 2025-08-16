import axios from 'axios';

// Helper function to get the base URL
const getBaseURL = () => {
  // In development, use the full URL to avoid CORS issues
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:5000';
  }
  // In production, use the relative path
  return process.env.REACT_APP_API_URL || '';
};

// Create axios instance with base URL
const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 10000 // 10 second timeout
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Skip for external URLs
    if (config.url.startsWith('http')) {
      return config;
    }

    // Ensure the URL starts with /api/
    let url = config.url;
    if (!url.startsWith('/api/')) {
      // Remove any leading slashes to avoid double slashes
      url = url.replace(/^\/+/, '');
      // Add /api/ prefix
      url = `/api/${url}`;
      config.url = url;
    }

    // Add auth token if it exists
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('Response error:', error);

    // Handle network errors
    if (error.code === 'ERR_NETWORK') {
      console.error('Network error - is the backend server running?');
      return Promise.reject(new Error('Unable to connect to the server. Please check your internet connection and try again.'));
    }

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401) {
      // If we're already on the login page, don't redirect again
      if (!window.location.pathname.includes('login')) {
        localStorage.removeItem('token');
        window.location.href = '/login?session=expired';
      }
    }

    // For other errors, just pass them through
    return Promise.reject(error);
  }
);

export default api;