// @ts-check
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3006';

async function testApi() {
  try {
    console.log('Testing API endpoints...\n');

    // Test registration
    console.log('1. Testing registration...');
    const registerResponse = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Test123!',
        name: 'Test User'
      })
    });
    
    console.log(`Status: ${registerResponse.status}`);
    const registerText = await registerResponse.text();
    try {
      const registerData = JSON.parse(registerText);
      console.log('Response:', registerData);
    } catch (e) {
      console.log('Response (text):', registerText);
    }
    console.log();

    // Test login
    console.log('2. Testing login...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Test123!'
      })
    });
    
    console.log(`Status: ${loginResponse.status}`);
    const loginText = await loginResponse.text();
    let authCookie;
    try {
      const loginData = JSON.parse(loginText);
      console.log('Response:', loginData);
      authCookie = loginResponse.headers.get('set-cookie');
      console.log('Auth Cookie:', authCookie);
    } catch (e) {
      console.log('Response (text):', loginText);
    }
    console.log();

    if (!authCookie) {
      throw new Error('No auth cookie received');
    }

    // Test protected endpoint
    console.log('3. Testing protected endpoint...');
    const protectedResponse = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: {
        'Accept': 'application/json',
        'Cookie': authCookie
      }
    });
    
    console.log(`Status: ${protectedResponse.status}`);
    const protectedText = await protectedResponse.text();
    try {
      const protectedData = JSON.parse(protectedText);
      console.log('Response:', protectedData);
    } catch (e) {
      console.log('Response (text):', protectedText);
    }
    console.log();

    // Test logout
    console.log('4. Testing logout...');
    const logoutResponse = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Cookie': authCookie
      }
    });
    
    console.log(`Status: ${logoutResponse.status}`);
    const logoutText = await logoutResponse.text();
    try {
      const logoutData = JSON.parse(logoutText);
      console.log('Response:', logoutData);
    } catch (e) {
      console.log('Response (text):', logoutText);
    }
    console.log();

    // Test protected endpoint after logout
    console.log('5. Testing protected endpoint after logout...');
    const afterLogoutResponse = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: {
        'Accept': 'application/json',
        'Cookie': logoutResponse.headers.get('set-cookie') || ''
      }
    });
    
    console.log(`Status: ${afterLogoutResponse.status}`);
    const afterLogoutText = await afterLogoutResponse.text();
    try {
      const afterLogoutData = JSON.parse(afterLogoutText);
      console.log('Response:', afterLogoutData);
    } catch (e) {
      console.log('Response (text):', afterLogoutText);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the tests
testApi();