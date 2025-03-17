// components/auth/Login.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.js';
import { LockClosedIcon, 
  ExclamationCircleIcon,
  InformationCircleIcon
 } from '@heroicons/react/24/outline';

const Login = () => {
  const { login, isAuthenticated, error: authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState(5);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check for redirects or messages in URL params
  const queryParams = new URLSearchParams(location.search);
  const redirectTo = queryParams.get('redirect') || '/';
  const isSessionExpired = queryParams.get('expired') === 'true';
  const isEmailVerified = queryParams.get('verified') === 'true';
  
  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTo);
    }
  }, [isAuthenticated, navigate, redirectTo]);
  
  // Set error message from auth context
  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);
  
  // Handle login form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const loginData = {
        email,
        password,
        ...(requires2FA && { twoFactorCode })
      };

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.requires2FA) {
          setRequires2FA(true);
          setError('Please enter your 2FA code');
          return;
        } 
        
        if (data.attemptsRemaining) {
          setAttemptsRemaining(data.attemptsRemaining);
          setError(`Invalid credentials. ${data.attemptsRemaining} attempts remaining.`);
        } else if (data.lockUntil) {
          const lockTime = new Date(data.lockUntil);
          const minutes = Math.ceil((lockTime - new Date()) / 60000);
          setError(`Account is locked. Please try again in ${minutes} minutes.`);
        } else if (data.error === 'INVALID_2FA') {
          setError('Invalid 2FA code. Please try again.');
        } else {
          setError(data.message || 'Login failed. Please try again.');
        }
        return;
      }

      // Clear any existing errors
      setError('');
      
      // Successful login
      await login(data.token, data.refreshToken);
      
      // Navigate to the appropriate dashboard based on user role
      const dashboardRoute = handleUserRole(data.user);
      navigate(dashboardRoute);
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to HealthcareSync
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
              create a new account
            </Link>
          </p>
        </div>
        
        {/* Display session expired message */}
        {isSessionExpired && (
          <div className="rounded-md bg-yellow-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <InformationCircleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Your session has expired. Please sign in again.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Display email verified message */}
        {isEmailVerified && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <InformationCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">
                  Your email has been verified successfully. You can now sign in.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Display error message */}
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div className="relative">
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                <span className="text-sm text-gray-500">
                  {showPassword ? 'Hide' : 'Show'}
                </span>
              </button>
            </div>
            {requires2FA && (
              <div className="mt-4">
                <label htmlFor="twoFactorCode" className="sr-only">2FA Code</label>
                <input
                  id="twoFactorCode"
                  name="twoFactorCode"
                  type="text"
                  value={twoFactorCode}
                  onChange={(e) => {
                    setTwoFactorCode(e.target.value);
                    setError('');
                  }}
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Enter 2FA code"
                  autoComplete="one-time-code"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link to="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                loading 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <LockClosedIcon className="h-5 w-5 text-blue-500 group-hover:text-blue-400" aria-hidden="true" />
              </span>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;