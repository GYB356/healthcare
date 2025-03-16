import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import AppointmentReports from '../../pages/AppointmentReports';
import { AuthProvider } from '../../context/AuthContext';
import fetchMock from 'jest-fetch-mock';
import { BrowserRouter as Router } from 'react-router-dom';

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

describe('AppointmentReports', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  test('renders loading state initially', () => {
    render(
      <AuthProvider>
        <Router>
          <AppointmentReports />
        </Router>
      </AuthProvider>
    );
    expect(screen.getByText(/Loading appointment details.../i)).toBeInTheDocument();
  });

  test('renders error message when fetching appointment fails', async () => {
    fetchMock.mockRejectOnce(new Error('Failed to fetch appointment details'));

    render(
      <AuthProvider>
        <Router>
          <AppointmentReports />
        </Router>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch appointment details/i)).toBeInTheDocument();
    });
  });

  test('renders appointment details when fetching succeeds', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({
      _id: '123',
      title: 'Test Appointment',
      date: '2023-01-01',
      time: '10:00 AM',
      doctor: { _id: '1', name: 'Dr. Smith', specialty: 'Cardiology' },
      patient: { _id: '2', name: 'John Doe' },
      status: 'completed',
      notes: 'Test notes'
    }));

    render(
      <AuthProvider>
        <Router>
          <AppointmentReports />
        </Router>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Test Appointment/i)).toBeInTheDocument();
      expect(screen.getByText(/Dr. Smith - Cardiology/i)).toBeInTheDocument();
      expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
      expect(screen.getByText(/Test notes/i)).toBeInTheDocument();
    });
  });

  test('renders report viewer for completed appointments', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({
      _id: '123',
      title: 'Test Appointment',
      date: '2023-01-01',
      time: '10:00 AM',
      doctor: { _id: '1', name: 'Dr. Smith', specialty: 'Cardiology' },
      patient: { _id: '2', name: 'John Doe' },
      status: 'completed',
      notes: 'Test notes'
    }));

    render(
      <AuthProvider>
        <Router>
          <AppointmentReports />
        </Router>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Reports are only available for completed appointments./i)).toBeInTheDocument();
    });
  });
});
