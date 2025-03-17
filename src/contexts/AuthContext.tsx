import React, { createContext, useState, useContext, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import AuthService from '@/services/AuthService';
import { User, AuthResponse } from '@/types/auth';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  register: (userData: { email: string; password: string; name: string }) => Promise<AuthResponse>;
  login: (email: string, password: string, twoFactorCode?: string) => Promise<AuthResponse>;
  logout: () => void;
}

interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    currentUser: null,
    isAuthenticated: false,
    loading: true,
    error: null
  });

  // Set up axios interceptors for token handling
  useEffect(() => {
    // Request interceptor to add token to headers
    const requestInterceptor = axios.interceptors.request.use(
      config => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token refresh
    const responseInterceptor = axios.interceptors.response.use(
      response => response,
      async (error: AxiosError) => {
        const originalRequest = error.config;
        
        // If error is 401 and we haven't already tried refreshing
        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
              // Try to refresh the token
              const response = await AuthService.refreshToken(refreshToken);
              
              // Update local storage with new tokens
              localStorage.setItem('token', response.token);
              localStorage.setItem('refreshToken', response.refreshToken);
              
              // Retry the original request with the new token
              originalRequest.headers.Authorization = `Bearer ${response.token}`;
              return axios(originalRequest);
            }
          } catch (refreshError) {
            // If refresh fails, log out
            logout();
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );

    // Clean up interceptors on unmount
    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  // Initialize auth state from local storage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const user = AuthService.getCurrentUser();
        
        if (user) {
          // Validate the token
          try {
            const response = await axios.get<{ user: User }>('/api/auth/me');
            setState(prev => ({
              ...prev,
              currentUser: response.data.user,
              isAuthenticated: true,
              loading: false
            }));
          } catch (err) {
            // Token validation failed, try to refresh
            try {
              const refreshToken = localStorage.getItem('refreshToken');
              if (refreshToken) {
                const refreshResponse = await AuthService.refreshToken(refreshToken);
                localStorage.setItem('token', refreshResponse.token);
                localStorage.setItem('refreshToken', refreshResponse.refreshToken);
                
                const validateResponse = await axios.get<{ user: User }>('/api/auth/me');
                setState(prev => ({
                  ...prev,
                  currentUser: validateResponse.data.user,
                  isAuthenticated: true,
                  loading: false
                }));
              }
            } catch (refreshErr) {
              // Refresh failed, log out
              logout();
            }
          }
        } else {
          setState(prev => ({ ...prev, loading: false }));
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setState(prev => ({ ...prev, loading: false }));
      }
    };

    initAuth();
  }, []);

  // Register a new user
  const register = async (userData: { email: string; password: string; name: string }) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      const response = await AuthService.register(userData);
      
      // Store user data and tokens
      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.setItem('token', response.token);
      localStorage.setItem('refreshToken', response.refreshToken);
      
      setState(prev => ({
        ...prev,
        currentUser: response.user,
        isAuthenticated: true
      }));
      
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw err;
    }
  };

  // Log in a user
  const login = async (email: string, password: string, twoFactorCode?: string) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      const response = await AuthService.login(email, password, twoFactorCode);
      
      // Store user data and tokens
      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.setItem('token', response.token);
      localStorage.setItem('refreshToken', response.refreshToken);
      
      setState(prev => ({
        ...prev,
        currentUser: response.user,
        isAuthenticated: true
      }));
      
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw err;
    }
  };

  // Log out the current user
  const logout = () => {
    AuthService.logout();
    setState({
      currentUser: null,
      isAuthenticated: false,
      loading: false,
      error: null
    });
  };

  // Auth context value
  const value: AuthContextType = {
    currentUser: state.currentUser,
    isAuthenticated: state.isAuthenticated,
    loading: state.loading,
    error: state.error,
    register,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 