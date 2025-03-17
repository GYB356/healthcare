// Manual Test Script for Login Functionality

// Test Case 1: Admin Login
console.log('Test Case 1: Admin Login');
const adminCredentials = {
  email: 'admin@test.com',
  password: 'admin123'
};

// Test Case 2: Provider Login
console.log('Test Case 2: Provider Login');
const providerCredentials = {
  email: 'provider@test.com',
  password: 'provider123'
};

// Test Case 3: Patient Login
console.log('Test Case 3: Patient Login');
const patientCredentials = {
  email: 'patient@test.com',
  password: 'patient123'
};

// Test Case 4: Invalid Credentials
console.log('Test Case 4: Invalid Credentials');
const invalidCredentials = {
  email: 'wrong@test.com',
  password: 'wrongpass'
};

// Test Case 5: 2FA Required
console.log('Test Case 5: 2FA Required');
const twoFactorCredentials = {
  email: '2fa@test.com',
  password: '2fapass',
  twoFactorCode: '123456'
};

// Manual Test Instructions
console.log(`
Manual Test Instructions:

1. Role-Based Redirect Test:
   a. Login as admin (${adminCredentials.email})
      - Should redirect to /admin/dashboard
   b. Login as provider (${providerCredentials.email})
      - Should redirect to /provider/dashboard
   c. Login as patient (${patientCredentials.email})
      - Should redirect to /patient/dashboard

2. Error Message Test:
   a. Try invalid credentials
      - Should show "Invalid credentials" with attempts remaining
   b. Try multiple failed attempts
      - Should show account lockout message
   c. Try 2FA login
      - Should prompt for 2FA code
      - Should show error for invalid 2FA code

3. Session Persistence Test:
   a. Login successfully
   b. Refresh the page
      - Should remain logged in
      - Should stay on dashboard
   c. Check localStorage
      - Should have token
      - Should have refreshToken
      - Should have userRole

4. Error Handling Test:
   a. Network error
      - Disable internet connection
      - Try to login
      - Should show network error message
   b. Server error
      - Should show appropriate error message

5. Security Test:
   a. Check token storage
      - Open DevTools > Application > Storage
      - Verify tokens are stored securely
   b. Check session timeout
      - Wait for session to expire
      - Should redirect to login with expired message

Steps to run each test:
1. Clear browser storage (localStorage) before each test
2. Use the credentials provided above
3. Verify the expected behavior
4. Document any unexpected behavior
`);

// Helper function to clear storage
const clearStorage = () => {
  localStorage.clear();
  console.log('Storage cleared');
};

// Helper function to check storage
const checkStorage = () => {
  console.log('Current Storage State:');
  console.log('Token:', localStorage.getItem('token') ? 'Present' : 'Missing');
  console.log('Refresh Token:', localStorage.getItem('refreshToken') ? 'Present' : 'Missing');
  console.log('User Role:', localStorage.getItem('userRole'));
};

// Export test helpers
export const testHelpers = {
  clearStorage,
  checkStorage,
  credentials: {
    admin: adminCredentials,
    provider: providerCredentials,
    patient: patientCredentials,
    invalid: invalidCredentials,
    twoFactor: twoFactorCredentials
  }
}; 