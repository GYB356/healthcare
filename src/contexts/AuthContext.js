// contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AuthService from '../services/AuthService.js';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Check if user is already logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchCurrentUser(token);
    } else {
      setLoading(false);
    }
  }, []);
  
  // Fetch current user data with better error handling
  const fetchCurrentUser = async (token) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to fetch user data');
      }
      
      const data = await response.json();
      
      if (!data.user) {
        throw new Error('No user data received');
      }
      
      // Validate required user fields
      if (!data.user.id || !data.user.email || !data.user.role) {
        throw new Error('Invalid user data received');
      }
      
      setCurrentUser(data.user);
    } catch (error) {
      console.error('Error fetching user:', error);
      await logout();
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  // Login function
  const login = async (token, refreshToken) => {
    try {
      setError(null);
      
      // Validate tokens
      if (!token || !refreshToken) {
        throw new Error('Invalid authentication tokens received');
      }

      // Store tokens
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      
      // Fetch user data
      await fetchCurrentUser(token);
      
      // Clear any existing errors
      setError(null);
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      setCurrentUser(null);
      setError(error.message || 'Login failed. Please try again.');
      throw error;
    }
  };
  
  // Logout function
  const logout = async () => {
    try {
      const token = localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ refreshToken })
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      setCurrentUser(null);
    }
  };
  
  // Refresh token function
  const refreshAuthToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await fetch('/api/auth/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });
      
      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }
      
      const data = await response.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      return data.token;
    } catch (error) {
      console.error('Token refresh error:', error);
      logout();
      throw error;
    }
  };
  
  // Axios interceptor for token refresh
  useEffect(() => {
    const requestInterceptor = async (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    };
    
    const responseInterceptor = async (error) => {
      const originalRequest = error.config;
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          const newToken = await refreshAuthToken();
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return fetch(originalRequest);
        } catch (refreshError) {
          return Promise.reject(refreshError);
        }
      }
      return Promise.reject(error);
    };
    
    // Add interceptors to fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const [resource, config] = args;
      
      // Apply request interceptor
      const modifiedConfig = await requestInterceptor(config || {});
      
      try {
        const response = await originalFetch(resource, modifiedConfig);
        if (response.status === 401) {
          return responseInterceptor({ 
            response, 
            config: modifiedConfig 
          });
        }
        return response;
      } catch (error) {
        return responseInterceptor(error);
      }
    };
    
    return () => {
      window.fetch = originalFetch;
    };
  }, []);
  
  // Register function
  const register = async (userData) => {
    try {
      setError(null);
      
      // Use AuthService register
      const response = await AuthService.register(userData);
      
      setCurrentUser(response.user);
      return response.user;
    } catch (error) {
      setError(error.message || 'Registration failed. Please try again.');
      throw error;
    }
  };
  
  // Update user profile (keeping for backward compatibility)
  const updateProfile = async (userData) => {
    try {
      setError(null);
      
      // This function would need to be added to AuthService
      // For now, just returning the userData
      setCurrentUser(prevUser => ({
        ...prevUser,
        ...userData
      }));
      
      return userData;
    } catch (error) {
      setError(
        error.message || 
        'Failed to update profile. Please try again.'
      );
      throw error;
    }
  };
  
  // Reset password request
  const requestPasswordReset = async (email) => {
    try {
      setError(null);
      return await AuthService.requestPasswordReset(email);
    } catch (error) {
      setError(error.message || 'Failed to request password reset. Please try again.');
      throw error;
    }
  };
  
  // Reset password with token
  const resetPassword = async (token, password) => {
    try {
      setError(null);
      return await AuthService.resetPassword(token, password);
    } catch (error) {
      setError(
        error.message || 
        'Failed to reset password. Token may be invalid or expired.'
      );
      throw error;
    }
  };
  
  // Handle user role with validation
  const handleUserRole = (user) => {
    if (!user || !user.role) {
      throw new Error('Invalid user data - role not found');
    }
    
    // Map role to specific dashboard route
    const roleRouteMap = {
      'admin': '/admin/dashboard',
      'provider': '/provider/dashboard',
      'patient': '/patient/dashboard'
    };
    
    const defaultRoute = '/dashboard';
    
    // Validate role exists in map
    if (!roleRouteMap[user.role]) {
      console.warn(`Unknown role "${user.role}" - redirecting to default dashboard`);
      return defaultRoute;
    }
    
    // Set role-specific data in localStorage
    try {
      localStorage.setItem('userRole', user.role);
    } catch (error) {
      console.error('Failed to store user role:', error);
    }
    
    return roleRouteMap[user.role];
  };
  
  // Check if user has specific role with validation
  const hasRole = (role) => {
    if (!role || typeof role !== 'string') {
      return false;
    }
    return currentUser?.role === role;
  };
  
  // Context value
  const value = {
    currentUser,
    loading,
    error,
    isAuthenticated: !!currentUser,
    login,
    register,
    logout,
    updateProfile,
    requestPasswordReset,
    resetPassword,
    hasRole,
    handleUserRole
  };
  
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;