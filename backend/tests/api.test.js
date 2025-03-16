const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const Report = require('../models/Report');
const User = require('../models/User');

let mongoServer;

// Mock the AI utils
jest.mock('../utils/aiUtils', () => ({
  generateMedicalReport: jest.fn().mockResolvedValue('Test medical report content'),
  extractMedicalInfo: jest.fn().mockResolvedValue({
    symptoms: ['Headache', 'Fever'],
    diagnosis: 'Common cold',
    recommendations: ['Rest', 'Fluids'],
    medications: ['Paracetamol'],
    followUpNeeded: false
  }),
  generateFollowUpQuestions: jest.fn().mockResolvedValue('Follow up questions')
}));

// Create a test user and get auth token
const getAuthToken = async () => {
  const testUser = await User.create({
    name: 'Test Doctor',
    email: 'testdoctor@example.com',
    password: 'password123',
    role: 'doctor'
  });
  
  const response = await request(app)
    .post('/api/users/login')
    .send({
      email: 'testdoctor@example.com',
      password: 'password123'
    });
  
  return response.body.token;
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Report API', () => {
  let token, appointmentId;
  
  beforeAll(async () => {
    token = await getAuthToken();
    
    // Create a test appointment
    const appointmentResponse = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        patientName: 'Test Patient',
        date: new Date().toISOString(),
        reason: 'Test appointment'
      });
    
    appointmentId = appointmentResponse.body._id;
  });
  
  beforeEach(async () => {
    await Report.deleteMany({});
  });
  
  test('Should generate a new report', async () => {
    const response = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${token}`)
      .send({
        appointmentId,
        transcript: 'This is a test transcript'
      });
    
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('report');
    expect(response.body.report).toHaveProperty('_id');
    expect(response.body.report.report).toBe('Test medical report content');
  });
  
  test('Should fail with bad request if transcript is missing', async () => {
    const response = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${token}`)
      .send({
        appointmentId
      });
    
    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('message', 'Appointment ID and transcript required');
  });
  
  test('Should fetch reports for an appointment', async () => {
    // First create a report
    await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${token}`)
      .send({
        appointmentId,
        transcript: 'This is a test transcript'
      });
    
    // Then fetch reports for the appointment
    const response = await request(app)
      .get(`/api/reports/${appointmentId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(1);
    expect(response.body[0].appointmentId).toBe(appointmentId);
  });
  
  test('Should fetch a specific report by ID', async () => {
    // First create a report
    const createResponse = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${token}`)
      .send({
        appointmentId,
        transcript: 'This is a test transcript'
      });
    
    const reportId = createResponse.body.report._id;
    
    // Then fetch the specific report
    const response = await request(app)
      .get(`/api/reports/detail/${reportId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('_id', reportId);
  });

  test('Should handle report generation failure', async () => {
    jest.mock('../utils/aiUtils', () => ({
      generateMedicalReport: jest.fn().mockRejectedValue(new Error('AI service failed')),
      extractMedicalInfo: jest.fn().mockResolvedValue({
        symptoms: ['Headache', 'Fever'],
        diagnosis: 'Common cold',
        recommendations: ['Rest', 'Fluids'],
        medications: ['Paracetamol'],
        followUpNeeded: false
      }),
      generateFollowUpQuestions: jest.fn().mockResolvedValue('Follow up questions')
    }));

    const response = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${token}`)
      .send({
        appointmentId,
        transcript: 'This is a test transcript'
      });

    expect(response.statusCode).toBe(500);
    expect(response.body).toHaveProperty('message', 'Server error');
  });
});
