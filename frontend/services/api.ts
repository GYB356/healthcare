import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { ApiResponse, Appointment, Report, User } from '../../types';

// Create axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle token expiration
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Redirect to login if on client side
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// API service class
export class ApiService {
  // Auth endpoints
  static async login(email: string, password: string): Promise<ApiResponse<{ token: string; user: User }>> {
    try {
      const response = await api.post('/users/login', { email, password });
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  static async register(userData: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const response = await api.post('/users/register', userData);
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Appointment endpoints
  static async getAppointments(): Promise<ApiResponse<Appointment[]>> {
    try {
      const response = await api.get('/appointments');
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  static async getAppointment(id: string): Promise<ApiResponse<Appointment>> {
    try {
      const response = await api.get(`/appointments/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  static async createAppointment(appointmentData: Partial<Appointment>): Promise<ApiResponse<Appointment>> {
    try {
      const response = await api.post('/appointments', appointmentData);
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Report endpoints
  static async getReports(appointmentId: string): Promise<ApiResponse<Report[]>> {
    try {
      const response = await api.get(`/reports/${appointmentId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  static async getReport(reportId: string): Promise<ApiResponse<Report>> {
    try {
      const response = await api.get(`/reports/detail/${reportId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  static async createReport(appointmentId: string, transcript: string): Promise<ApiResponse<{ message: string; report: Report }>> {
    try {
      const response = await api.post('/reports', { appointmentId, transcript });
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Private helper methods
  private static handleError(error: any): ApiResponse<never> {
    const errorMessage = error.response?.data?.message || 'Something went wrong';
    return {
      success: false,
      error: errorMessage,
    };
  }
}

export default api;
