import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ConsultationReport from '../../components/ConsultationReport';
import { AuthProvider } from '../../context/AuthContext';
import fetchMock from 'jest-fetch-mock';

// Mock the useAuth hook
jest.mock('../../context/AuthContext', () => {
  const originalModule = jest.requireActual('../../context/AuthContext');
  return {
    ...originalModule,
    useAuth: () => ({
      token: 'mock-token',
      user: { role: 'doctor' },
    }),
  };
});

describe('ConsultationReport', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  test('renders without crashing', () => {
    render(<ConsultationReport appointmentId="123" transcript="Test transcript" />);
    expect(screen.getByText(/Consultation Report/i)).toBeInTheDocument();
  });

  test('shows generate button when transcript is provided', () => {
    render(<ConsultationReport appointmentId="123" transcript="Test transcript" />);
    expect(screen.getByText(/Generate Full Report/i)).toBeInTheDocument();
  });

  test('shows message when transcript is not available', () => {
    render(<ConsultationReport appointmentId="123" transcript="" />);
    expect(screen.getByText(/No consultation transcript available/i)).toBeInTheDocument();
  });

  test('generates report on button click', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({
      report: {
        report: 'Test report content',
        medicalInfo: {
          symptoms: ['Symptom 1'],
          diagnosis: 'Test diagnosis',
          recommendations: ['Recommendation 1'],
          medications: [],
          followUpNeeded: false
        },
        followUpQuestions: 'Test follow-up questions'
      }
    }));

    render(<ConsultationReport appointmentId="123" transcript="Test transcript" />);
    
    // Click generate report button
    fireEvent.click(screen.getByText(/Generate Full Report/i));
    
    // Wait for the report to be displayed
    await waitFor(() => {
      expect(screen.getByText(/Test report content/i)).toBeInTheDocument();
    });
  });

  test('shows error message when report generation fails', async () => {
    fetchMock.mockRejectOnce(new Error('Failed to generate report'));

    render(<ConsultationReport appointmentId="123" transcript="Test transcript" />);
    
    // Click generate report button
    fireEvent.click(screen.getByText(/Generate Full Report/i));
    
    // Wait for the error message to be displayed
    await waitFor(() => {
      expect(screen.getByText(/Failed to generate report. Please try again./i)).toBeInTheDocument();
    });
  });
});
