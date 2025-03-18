import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';

/**
 * Sets authentication token in both localStorage and cookies for redundancy
 */
export function setAuthToken(token) {
  if (typeof window === 'undefined') return;
  
  console.log('Setting auth token...');
  
  // Store in localStorage
  localStorage.setItem('token', token);
  
  // Also store in cookies for backup
  Cookies.set('token', token, { expires: 7 });
  
  // Set token for API requests
  setupAuthHeaderForAPI(token);
  
  return true;
}

/**
 * Gets authentication token from localStorage or cookies
 */
export function getAuthToken() {
  if (typeof window === 'undefined') return null;
  
  // Try localStorage first
  const token = localStorage.getItem('token');
  
  // Fall back to cookies
  if (!token) {
    return Cookies.get('token');
  }
  
  return token;
}

/**
 * Removes authentication token from all storage
 */
export function removeAuthToken() {
  if (typeof window === 'undefined') return;
  
  console.log('Removing auth token...');
  
  // Clear localStorage
  localStorage.removeItem('token');
  
  // Clear cookies
  Cookies.remove('token');
}

/**
 * Set up default auth header for API requests
 */
export function setupAuthHeaderForAPI(token) {
  if (typeof window === 'undefined' || !token) return;
  
  // If using fetch directly
  window.authHeader = {
    'Authorization': `Bearer ${token}`
  };
  
  // If using axios, you would do:
  // axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

/**
 * Redirects to login if user is not authenticated
 */
export function useRequireAuth(redirectTo = '/auth/login') {
  const router = useRouter();
  
  useEffect(() => {
    const checkAuth = async () => {
      const token = getAuthToken();
      
      if (!token) {
        console.log('No token found, redirecting to login');
        router.push(redirectTo);
        return;
      }
      
      // Validate token with backend
      try {
        console.log('Validating token...');
        const response = await fetch('/api/auth/validate', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Token validation failed');
        }
        
        const data = await response.json();
        console.log('Token validation successful:', data);
      } catch (error) {
        console.error('Auth validation error:', error);
        removeAuthToken();
        router.push(redirectTo);
      }
    };
    
    checkAuth();
  }, [router, redirectTo]);
  
  return { getAuthToken };
}

/**
 * Hook to get current user data
 */
export function useUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  
  useEffect(() => {
    const fetchUser = async () => {
      const token = getAuthToken();
      
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }
        
        const data = await response.json();
        setUser(data.user);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError(error.message);
        
        // If unauthorized, redirect to login
        if (error.message.includes('401') || error.message.includes('403')) {
          removeAuthToken();
          router.push('/auth/login');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchUser();
  }, [router]);
  
  return { user, loading, error };
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  return !!getAuthToken();
}

/**
 * Debug auth state
 */
export function debugAuth() {
  if (typeof window === 'undefined') return null;
  
  const localStorageToken = localStorage.getItem('token');
  const cookieToken = Cookies.get('token');
  
  console.group('Auth Debug Info');
  console.log('localStorage token:', localStorageToken ? '✅ Present' : '❌ Missing');
  console.log('cookie token:', cookieToken ? '✅ Present' : '❌ Missing');
  console.log('token match:', localStorageToken === cookieToken ? '✅ Matching' : '❌ Different');
  console.groupEnd();
  
  return {
    isAuthenticated: !!(localStorageToken || cookieToken),
    storage: !!localStorageToken,
    cookie: !!cookieToken,
    match: localStorageToken === cookieToken
  };
} 