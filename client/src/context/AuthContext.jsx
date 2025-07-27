import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { mockAuth, shouldUseMockData } from '../utils/mockAuth';

const AuthContext = createContext();

// API base URL - always use production URL for deployed app
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://sweet-shop-management-psi.vercel.app';

// Configure axios defaults
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.headers.common['Content-Type'] = 'application/json';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Set up axios interceptor for auth token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    // Response interceptor to handle token expiration
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  // Check for existing token on app load
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        try {
          const user = JSON.parse(userData);
          setUser(user);
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } catch (error) {
          console.error('Error parsing user data:', error);
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Attempting login with:', { email, baseURL: API_BASE_URL });
      
      // Try real API first, fall back to mock if needed
      let response;
      try {
        console.log('Attempting login to:', `${API_BASE_URL}/api/auth/login`);
        response = await axios.post('/api/auth/login', {
          email,
          password
        }, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000
        });
      } catch (networkError) {
        console.warn('API call failed:', networkError.message);
        console.warn('Network error details:', networkError.response?.data || networkError);
        
        if (shouldUseMockData || networkError.code === 'ERR_NETWORK' || networkError.response?.status >= 500) {
          console.log('Using mock authentication');
          const mockResult = await mockAuth.login(email, password);
          
          // Store mock token and user data
          localStorage.setItem('token', mockResult.token);
          localStorage.setItem('user', JSON.stringify(mockResult.user));
          
          setUser(mockResult.user);
          return { success: true, user: mockResult.user };
        }
        throw networkError;
      }

      console.log('Login response:', response.data);

      const { token, user: userData } = response.data;
      
      // Store token and user data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      console.log('Setting user in context:', userData);
      setUser(userData);
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = 'Login failed - please try again';
      
      if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
        errorMessage = 'Cannot connect to server. You can add "?mock=true" to the URL to try demo mode.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response?.data?.message || 'Invalid email or password';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error - please try again later';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Attempting registration with:', { ...userData, password: '[HIDDEN]' });
      console.log('Registration URL:', `${API_BASE_URL}/api/auth/register`);
      
      const response = await axios.post('/api/auth/register', userData, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000
      });
      
      console.log('Registration response:', response.data);
      
      const { token, user: newUser } = response.data;
      
      // Store token and user data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(newUser));
      
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      console.log('Setting user in context after registration:', newUser);
      setUser(newUser);
      
      return { success: true, user: newUser };
    } catch (error) {
      console.error('Registration error:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = 'Registration failed - please try again';
      
      if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
        errorMessage = 'Cannot connect to server. Please check if the server is running or try again later.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response?.data?.message || 'Registration failed - please check your information';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error - please try again later';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setError('');
  };

  const clearError = () => {
    setError('');
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    clearError,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isCustomer: user?.role === 'customer'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
