/**
 * EMERGENCY REFRESH LOOP BREAKER
 * 
 * This script detects and breaks refresh loops in Next.js applications.
 * To use: Import and call this function in your root layout component.
 */

export function initLoopBreaker() {
  // Check if we're in the browser
  if (typeof window !== 'undefined') {
    console.log('🔍 Loop breaker activated');
    
    // Track page loads
    const now = Date.now();
    const lastLoad = parseInt(sessionStorage.getItem('lastPageLoad') || '0');
    const loadCount = parseInt(sessionStorage.getItem('pageLoadCount') || '0');
    const timeBetweenLoads = now - lastLoad;
    
    // Store current values
    sessionStorage.setItem('lastPageLoad', now.toString());
    sessionStorage.setItem('pageLoadCount', (loadCount + 1).toString());
    
    // Log diagnostic info
    console.log(`Page load #${loadCount + 1} | Time since last load: ${timeBetweenLoads}ms`);
    
    // Check for refresh loops (3+ rapid refreshes with <1000ms between them)
    if (loadCount >= 2 && timeBetweenLoads < 1000) {
      console.error('⚠️ REFRESH LOOP DETECTED!');
      
      // Check if we already tried to break the loop
      if (sessionStorage.getItem('breakingLoop') !== 'true') {
        console.log('Attempting to break the loop...');
        sessionStorage.setItem('breakingLoop', 'true');
        
        // Override the page with a static emergency page
        document.body.innerHTML = `
          <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h1 style="margin-top: 0; color: #e53e3e; font-size: 24px;">Refresh Loop Detected</h1>
            <p>Your application was caught in an infinite refresh loop and has been stopped.</p>
            
            <div style="background: #f7fafc; border-radius: 6px; padding: 16px; margin: 24px 0; font-size: 14px;">
              <p><strong>Diagnostic Information:</strong></p>
              <ul style="margin-bottom: 0; padding-left: 20px;">
                <li>URL: ${window.location.href}</li>
                <li>Refresh count: ${loadCount + 1}</li>
                <li>Time between refreshes: ${timeBetweenLoads}ms</li>
                <li>Token exists: ${!!localStorage.getItem('token')}</li>
                <li>Path: ${window.location.pathname}</li>
              </ul>
            </div>
            
            <h2 style="font-size: 18px; margin-top: 24px;">Common Causes:</h2>
            <ol style="padding-left: 20px;">
              <li>Authentication middleware redirecting in a loop</li>
              <li>useEffect dependencies causing infinite rerenders</li>
              <li>Conflict between server and client-side redirects</li>
              <li>Layout components reacting to auth state changes</li>
            </ol>
            
            <div style="margin-top: 24px;">
              <button onclick="sessionStorage.clear(); localStorage.clear(); window.location.href = '/auth/login';" 
                   style="background: #3182ce; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                Clear Storage & Go to Login
              </button>
              
              <button onclick="sessionStorage.removeItem('breakingLoop'); sessionStorage.removeItem('pageLoadCount'); window.location.pathname = '/';" 
                   style="background: #718096; color: white; border: none; padding: 8px 16px; border-radius: 4px; margin-left: 8px; cursor: pointer;">
                Reset & Go to Homepage
              </button>
            </div>
          </div>
        `;
        
        // Stop any further rendering to break the loop
        throw new Error('Refresh loop detected and broken');
      }
    } else if (loadCount > 10) {
      // Reset counter after 10 successful loads without triggering the loop detection
      sessionStorage.removeItem('pageLoadCount');
      sessionStorage.removeItem('breakingLoop');
    }
  }
} 