'use client';

import { useEffect, useState } from 'react';

interface User {
  role?: 'patient' | 'doctor' | 'nurse' | 'staff' | 'administrator';
  email?: string;
  id?: string;
  name?: string;
  department?: string;
  [key: string]: any;
}

interface LoginResponse {
  token: string;
  user: User;
  error?: string;
}

export default function DiagnosticLogin() {
  const [status, setStatus] = useState('Not logged in');
  const [userInfo, setUserInfo] = useState('');
  const [isDashboardEnabled, setIsDashboardEnabled] = useState(false);
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({});
  const [refreshCount, setRefreshCount] = useState(0);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(Date.now());

  // Refresh loop detection and prevention
  useEffect(() => {
    const currentTime = Date.now();
    const timeSinceLastRefresh = currentTime - lastRefreshTime;
    
    // If we've refreshed more than 5 times in 10 seconds, we're in a loop
    if (refreshCount > 5 && timeSinceLastRefresh < 10000) {
      console.error('Refresh loop detected!');
      // Clear all storage to break the loop
      localStorage.clear();
      sessionStorage.clear();
      // Force a clean state
      window.location.href = '/diagnostic-login?clean=true';
      return;
    }

    // Update refresh tracking
    setRefreshCount(prev => prev + 1);
    setLastRefreshTime(currentTime);

    // Reset refresh count after 10 seconds of stability
    const resetTimer = setTimeout(() => {
      setRefreshCount(0);
    }, 10000);

    return () => clearTimeout(resetTimer);
  }, []);

  // Update debug info periodically
  useEffect(() => {
    const updateDebugInfo = () => {
      setDebugInfo({
        currentUrl: window.location.href,
        tokenPresent: Boolean(localStorage.getItem('token')),
        userAgent: navigator.userAgent,
        sessionStorageKeys: Object.keys(sessionStorage),
        localStorageKeys: Object.keys(localStorage),
        timestamp: new Date().toISOString(),
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
        refreshCount,
        timeSinceLastRefresh: Date.now() - lastRefreshTime,
      });
    };

    updateDebugInfo();
    const interval = setInterval(updateDebugInfo, 2000);
    return () => clearInterval(interval);
  }, [refreshCount, lastRefreshTime]);

  const loginWithHardcodedCredentials = async () => {
    try {
      setStatus('Attempting login...');
      
      // Log request details
      console.log('Login request:', {
        url: '/api/auth/login',
        method: 'POST',
        body: { email: 'test@healthcaresync.com', password: 'password' }
      });

      // Attempt login with the server
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: 'test@healthcaresync.com', 
          password: 'password' 
        })
      });
      
      const data: LoginResponse = await response.json();
      
      // Log response details
      console.log('Login response:', {
        status: response.status,
        ok: response.ok,
        hasToken: Boolean(data.token),
        userRole: data.user?.role
      });
      
      if (response.ok && data.token) {
        // Store token and user info in a simple, direct way
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Show success message
        setStatus('Login successful!');
        setUserInfo(JSON.stringify(data.user, null, 2));
        
        // Enable the navigation buttons
        setIsDashboardEnabled(true);
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setStatus(`Error: ${errorMessage}`);
      console.error('Login error:', error);
    }
  };
  
  const clearStorage = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      setStatus('Storage cleared');
      setUserInfo('');
      setIsDashboardEnabled(false);
      console.log('Storage cleared successfully');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setStatus(`Error clearing storage: ${errorMessage}`);
      console.error('Clear storage error:', error);
    }
  };
  
  const goToDashboard = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        setStatus('No user found. Please login first.');
        return;
      }
      
      const user: User = JSON.parse(userStr);
      const role = user.role?.toLowerCase() || 'patient';
      
      console.log('Navigating to dashboard:', {
        role,
        path: `/dashboard/${role}`,
        user: user
      });
      
      window.location.href = `/dashboard/${role}`;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setStatus(`Navigation error: ${errorMessage}`);
      console.error('Navigation error:', error);
    }
  };

  return (
    <div style={{ 
      fontFamily: 'system-ui, sans-serif', 
      maxWidth: '800px', 
      margin: '40px auto', 
      padding: '20px', 
      border: '1px solid #e2e8f0', 
      borderRadius: '8px' 
    }}>
      <h1 style={{ marginTop: 0 }}>HealthcareSync Diagnostic Login</h1>
      <p>This page bypasses Next.js routing for troubleshooting authentication issues.</p>
      
      <div style={{ margin: '20px 0' }}>
        <button 
          onClick={loginWithHardcodedCredentials}
          style={{ 
            background: '#3182ce', 
            color: 'white', 
            border: 'none', 
            padding: '8px 16px', 
            borderRadius: '4px', 
            cursor: 'pointer', 
            fontSize: '14px' 
          }}
        >
          Login with Test Account
        </button>
        
        <button 
          onClick={clearStorage}
          style={{ 
            background: '#e53e3e', 
            color: 'white', 
            border: 'none', 
            padding: '8px 16px', 
            borderRadius: '4px', 
            cursor: 'pointer', 
            marginLeft: '8px', 
            fontSize: '14px' 
          }}
        >
          Clear Storage
        </button>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <p><strong>Status:</strong> {status}</p>
        <pre style={{ 
          background: '#f7fafc', 
          padding: '10px', 
          borderRadius: '4px', 
          overflow: 'auto', 
          fontSize: '12px' 
        }}>
          {userInfo}
        </pre>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={goToDashboard}
          disabled={!isDashboardEnabled}
          style={{ 
            background: '#38a169', 
            color: 'white', 
            border: 'none', 
            padding: '8px 16px', 
            borderRadius: '4px', 
            cursor: isDashboardEnabled ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            opacity: isDashboardEnabled ? 1 : 0.5
          }}
        >
          Go to Dashboard
        </button>
      </div>
      
      <div style={{ 
        marginTop: '30px', 
        fontSize: '12px', 
        paddingTop: '20px', 
        borderTop: '1px solid #e2e8f0' 
      }}>
        <p><strong>Debug Information:</strong></p>
        <pre style={{ 
          background: '#f7fafc', 
          padding: '10px', 
          borderRadius: '4px', 
          overflow: 'auto', 
          fontSize: '12px' 
        }}>
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
        
        <div style={{ marginTop: '20px' }}>
          <p><strong>Storage Contents:</strong></p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <h4>localStorage:</h4>
              <pre style={{ 
                background: '#f7fafc', 
                padding: '10px', 
                borderRadius: '4px', 
                overflow: 'auto', 
                fontSize: '12px' 
              }}>
                {JSON.stringify(
                  Object.fromEntries(
                    Object.keys(localStorage).map(key => [
                      key,
                      key === 'token' ? '[REDACTED]' : localStorage.getItem(key)
                    ])
                  ),
                  null,
                  2
                )}
              </pre>
            </div>
            <div>
              <h4>sessionStorage:</h4>
              <pre style={{ 
                background: '#f7fafc', 
                padding: '10px', 
                borderRadius: '4px', 
                overflow: 'auto', 
                fontSize: '12px' 
              }}>
                {JSON.stringify(
                  Object.fromEntries(
                    Object.keys(sessionStorage).map(key => [
                      key,
                      sessionStorage.getItem(key)
                    ])
                  ),
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 