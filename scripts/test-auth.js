import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3006';
const TEST_USER = {
  email: `test${Date.now()}@example.com`,
  password: 'Test123!',
  name: 'Test User'
};

async function testAuth() {
  try {
    console.log('Testing authentication endpoints...\n');
    console.log('Using test user:', TEST_USER);
    console.log();

    // Test registration
    console.log('1. Testing registration...');
    const registerResponse = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(TEST_USER)
    });

    console.log(`Status: ${registerResponse.status}`);
    const registerData = await registerResponse.json();
    console.log('Response:', registerData);
    console.log();

    // Test login
    console.log('2. Testing login...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: TEST_USER.email,
        password: TEST_USER.password
      })
    });

    console.log(`Status: ${loginResponse.status}`);
    const loginData = await loginResponse.json();
    console.log('Response:', loginData);
    
    // Get auth cookie
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('Cookies:', cookies);
    console.log();

    if (!cookies) {
      throw new Error('No auth cookie received');
    }

    // Test get current user
    console.log('3. Testing get current user...');
    const meResponse = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: {
        Cookie: cookies
      }
    });

    console.log(`Status: ${meResponse.status}`);
    const meData = await meResponse.json();
    console.log('Response:', meData);
    console.log();

    // Test logout
    console.log('4. Testing logout...');
    const logoutResponse = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        Cookie: cookies
      }
    });

    console.log(`Status: ${logoutResponse.status}`);
    const logoutData = await logoutResponse.json();
    console.log('Response:', logoutData);
    console.log();

    // Test accessing protected route after logout
    console.log('5. Testing protected route after logout...');
    const afterLogoutResponse = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: {
        Cookie: logoutResponse.headers.get('set-cookie') || ''
      }
    });

    console.log(`Status: ${afterLogoutResponse.status}`);
    const afterLogoutData = await afterLogoutResponse.json();
    console.log('Response:', afterLogoutData);
    console.log();

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAuth();