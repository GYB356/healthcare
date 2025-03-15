const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Test configuration
const API_URL = process.env.API_URL || 'http://localhost:5000';
const TEST_TOKEN = process.env.TEST_TOKEN; // JWT token for authentication
const TEST_APPOINTMENT_ID = process.env.TEST_APPOINTMENT_ID || '60d21b4667d0d8992e610c85'; // Example appointment ID
const TEST_TRANSCRIPT = `
Doctor: Hello, how are you feeling today?
Patient: I've been having a persistent cough for about two weeks now, and I'm feeling quite tired.
Doctor: I'm sorry to hear that. Have you had any fever or chills?
Patient: Yes, I had a low-grade fever for a few days last week, but it's gone now.
`;

/**
 * This is a manual test script to verify the reports API functionality.
 * To run this test:
 * 1. Make sure your server is running
 * 2. Set the TEST_TOKEN environment variable with a valid JWT token
 * 3. Set the TEST_APPOINTMENT_ID with a valid appointment ID (optional)
 * 4. Run: node tests/reports.test.js
 */

async function testReportsAPI() {
  try {
    console.log('Testing Reports API...');
    
    // Test 1: Generate a new report
    console.log('\n1. Testing POST /api/reports');
    const createResponse = await axios.post(`${API_URL}/api/reports`, {
      appointmentId: TEST_APPOINTMENT_ID,
      transcript: TEST_TRANSCRIPT
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });
    
    console.log('Report created successfully:', createResponse.data.message);
    const reportId = createResponse.data.report._id;
    console.log('Report ID:', reportId);
    
    // Test 2: Fetch reports for an appointment
    console.log('\n2. Testing GET /api/reports/:appointmentId');
    const listResponse = await axios.get(`${API_URL}/api/reports/${TEST_APPOINTMENT_ID}`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });
    
    console.log('Reports fetched successfully. Count:', listResponse.data.length);
    
    // Test 3: Fetch a specific report
    console.log('\n3. Testing GET /api/reports/detail/:reportId');
    const detailResponse = await axios.get(`${API_URL}/api/reports/detail/${reportId}`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });
    
    console.log('Report details fetched successfully:');
    console.log('- Report ID:', detailResponse.data._id);
    console.log('- Report Text Length:', detailResponse.data.report.length);
    console.log('- Medical Info:', detailResponse.data.medicalInfo ? 'Present' : 'Not present');
    console.log('- Follow-up Questions:', detailResponse.data.followUpQuestions ? 'Present' : 'Not present');
    
    console.log('\nAll tests completed successfully!');
  } catch (error) {
    console.error('Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

// Run the tests
testReportsAPI()
  .then(() => {
    console.log('Tests completed.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Test script error:', err);
    process.exit(1);
  }); 