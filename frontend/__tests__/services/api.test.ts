import { ApiService } from '../../services/api';
import fetchMock from 'jest-fetch-mock';

describe('ApiService', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  test('login should return token and user data on success', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ token: 'mock-token', user: { _id: '1', name: 'John Doe', email: 'john@example.com', role: 'doctor' } }));

    const response = await ApiService.login('john@example.com', 'password123');
    expect(response.success).toBe(true);
    expect(response.data).toHaveProperty('token', 'mock-token');
    expect(response.data).toHaveProperty('user');
  });

  test('login should return error message on failure', async () => {
    fetchMock.mockRejectOnce(new Error('Invalid credentials'));

    const response = await ApiService.login('john@example.com', 'wrongpassword');
    expect(response.success).toBe(false);
    expect(response.error).toBe('Something went wrong');
  });

  test('getAppointments should return appointments on success', async () => {
    fetchMock.mockResponseOnce(JSON.stringify([{ _id: '1', doctor: 'Dr. Smith', patient: 'John Doe', date: '2023-01-01', time: '10:00 AM', status: 'scheduled' }]));

    const response = await ApiService.getAppointments();
    expect(response.success).toBe(true);
    expect(response.data).toHaveLength(1);
  });

  test('getAppointments should return error message on failure', async () => {
    fetchMock.mockRejectOnce(new Error('Failed to fetch appointments'));

    const response = await ApiService.getAppointments();
    expect(response.success).toBe(false);
    expect(response.error).toBe('Something went wrong');
  });

  test('createReport should return report data on success', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ message: 'Report saved', report: { _id: '1', report: 'Test report content' } }));

    const response = await ApiService.createReport('123', 'Test transcript');
    expect(response.success).toBe(true);
    expect(response.data).toHaveProperty('report');
  });

  test('createReport should return error message on failure', async () => {
    fetchMock.mockRejectOnce(new Error('Failed to create report'));

    const response = await ApiService.createReport('123', 'Test transcript');
    expect(response.success).toBe(false);
    expect(response.error).toBe('Something went wrong');
  });
});
