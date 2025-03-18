// Improved token storage and retrieval functions
export function setAuthToken(token: string): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    // Clear existing data first to avoid corruption
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    
    // Store in multiple places for redundancy
    localStorage.setItem('token', token);
    sessionStorage.setItem('token', token); // Backup in session storage
    
    // For debugging
    console.log('✅ Auth token saved successfully');
    
    // Verify storage worked
    const storedToken = localStorage.getItem('token');
    if (storedToken !== token) {
      console.error('⚠️ Token verification failed - storage may be corrupted');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Failed to save auth token:', error);
    return false;
  }
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    // Try localStorage first
    let token = localStorage.getItem('token');
    
    // Fall back to sessionStorage
    if (!token) {
      token = sessionStorage.getItem('token');
      if (token) {
        console.log('📝 Retrieved token from session storage backup');
        // Restore to localStorage if found in session
        localStorage.setItem('token', token);
      }
    }
    
    if (token) {
      console.log('🔑 Auth token found');
    } else {
      console.log('🔒 No auth token found');
    }
    
    return token;
  } catch (error) {
    console.error('❌ Error getting auth token:', error);
    return null;
  }
}

// Improved redirect function for login success
export function redirectAfterLogin(role: string, router: any) {
  // Function to handle the actual redirect
  const performRedirect = (path: string) => {
    console.log(`🚀 Redirecting to: ${path}`);
    
    // Try multiple redirect methods
    try {
      // 1. Next.js router (preferred)
      router.push(path);
      
      // 2. Set a timeout for fallback
      setTimeout(() => {
        if (window.location.pathname !== path) {
          console.log('⚠️ Router redirect may have failed, trying location.href');
          window.location.href = path;
        }
      }, 1000);
    } catch (error) {
      console.error('❌ Router redirect failed:', error);
      // Fallback to direct browser navigation
      window.location.href = path;
    }
  };
  
  // Determine redirect path based on role
  let redirectPath = '/dashboard';
  if (role && typeof role === 'string') {
    redirectPath = `/dashboard/${role.toLowerCase()}`;
  }
  
  console.log(`🧭 Determined redirect path: ${redirectPath}`);
  
  // Add a small delay to ensure token is saved and state is updated
  setTimeout(() => performRedirect(redirectPath), 300);
} 