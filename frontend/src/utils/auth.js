import axios from 'axios';

// Set up axios defaults for JWT
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Add JWT token to requests if available
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiration
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('teacherId');
      localStorage.removeItem('studentId');
      // Redirect to login if on protected page
      if (window.location.pathname !== '/' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (endpoint, credentials) => {
    const response = await axios.post(endpoint, credentials);
    const { token, teacherId, studentId } = response.data;
    if (token) {
      localStorage.setItem('token', token);
      if (teacherId) localStorage.setItem('teacherId', teacherId);
      if (studentId) localStorage.setItem('studentId', studentId);
      // Dispatch custom event to notify components of auth change
      window.dispatchEvent(new Event('authChange'));
    }
    return response;
  },

  signup: async (endpoint, credentials) => {
    const response = await axios.post(endpoint, credentials);
    const { token, teacherId, studentId } = response.data;
    if (token) {
      localStorage.setItem('token', token);
      if (teacherId) localStorage.setItem('teacherId', teacherId);
      if (studentId) localStorage.setItem('studentId', studentId);
    }
    return response;
  },

  logout: () => {
    if (!authService.isAuthenticated()) {
      return; // Do nothing if not authenticated
    }
    localStorage.removeItem('token');
    localStorage.removeItem('teacherId');
    localStorage.removeItem('studentId');
    window.dispatchEvent(new Event('authChange'));
    window.location.href = '/login';
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  getToken: () => {
    return localStorage.getItem('token');
  },

  getTeacherId: () => {
    return localStorage.getItem('teacherId');
  },

  getStudentId: () => {
    return localStorage.getItem('studentId');
  }
};

export default authService;
