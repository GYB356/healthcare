import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import Login from '../components/auth/Login';

// Mock fetch globally
global.fetch = jest.fn();

// Helper to setup mock responses
const mockFetchResponse = (status, data) => {
  global.fetch.mockImplementationOnce(() =>
    Promise.resolve({
      ok: status === 200,
      status,
      json: () => Promise.resolve(data)
    })
  );
};

describe('Login Component', () => {
  beforeEach(() => {
    // Clear localStorage and fetch mocks before each test
    localStorage.clear();
    global.fetch.mockClear();
  });

  // Test successful login for different roles
  const roleTests = [
    {
      role: 'admin',
      expectedRedirect: '/admin/dashboard',
      userData: {
        id: '1',
        email: 'admin@test.com',
        role: 'admin',
        name: 'Admin User'
      }
    },
    {
      role: 'provider',
      expectedRedirect: '/provider/dashboard',
      userData: {
        id: '2',
        email: 'provider@test.com',
        role: 'provider',
        name: 'Provider User'
      }
    },
    {
      role: 'patient',
      expectedRedirect: '/patient/dashboard',
      userData: {
        id: '3',
        email: 'patient@test.com',
        role: 'patient',
        name: 'Patient User'
      }
    }
  ];

  roleTests.forEach(({ role, expectedRedirect, userData }) => {
    test(`should login successfully and redirect ${role} to correct dashboard`, async () => {
      const mockNavigate = jest.fn();
      
      // Mock successful login response
      mockFetchResponse(200, {
        token: 'fake-token',
        refreshToken: 'fake-refresh-token',
        user: userData
      });

      // Mock user data fetch response
      mockFetchResponse(200, { user: userData });

      render(
        <BrowserRouter>
          <AuthProvider>
            <Login />
          </AuthProvider>
        </BrowserRouter>
      );

      // Fill in login form
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: userData.email }
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' }
      });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      // Verify redirect
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(expectedRedirect);
      });

      // Verify local storage
      expect(localStorage.getItem('token')).toBe('fake-token');
      expect(localStorage.getItem('refreshToken')).toBe('fake-refresh-token');
      expect(localStorage.getItem('userRole')).toBe(role);
    });
  });

  // Test error scenarios
  const errorTests = [
    {
      scenario: 'invalid credentials',
      response: {
        status: 401,
        data: {
          message: 'Invalid credentials',
          attemptsRemaining: 4
        }
      },
      expectedError: 'Invalid credentials. 4 attempts remaining.'
    },
    {
      scenario: 'account locked',
      response: {
        status: 401,
        data: {
          message: 'Account locked',
          lockUntil: new Date(Date.now() + 15 * 60000).toISOString()
        }
      },
      expectedError: 'Account is locked. Please try again in 15 minutes.'
    },
    {
      scenario: '2FA required',
      response: {
        status: 401,
        data: {
          requires2FA: true
        }
      },
      expectedError: 'Please enter your 2FA code'
    }
  ];

  errorTests.forEach(({ scenario, response, expectedError }) => {
    test(`should handle ${scenario} error correctly`, async () => {
      mockFetchResponse(response.status, response.data);

      render(
        <BrowserRouter>
          <AuthProvider>
            <Login />
          </AuthProvider>
        </BrowserRouter>
      );

      // Fill in login form
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' }
      });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      // Verify error message
      await waitFor(() => {
        expect(screen.getByText(expectedError)).toBeInTheDocument();
      });
    });
  });

  // Test session persistence
  test('should persist session after page refresh', async () => {
    const userData = {
      id: '1',
      email: 'test@example.com',
      role: 'admin',
      name: 'Test User'
    };

    // Set up initial auth state
    localStorage.setItem('token', 'fake-token');
    localStorage.setItem('refreshToken', 'fake-refresh-token');
    localStorage.setItem('userRole', 'admin');

    // Mock user data fetch response
    mockFetchResponse(200, { user: userData });

    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    );

    // Verify that the component redirects to dashboard
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard');
    });

    // Verify auth state persists
    expect(localStorage.getItem('token')).toBe('fake-token');
    expect(localStorage.getItem('refreshToken')).toBe('fake-refresh-token');
    expect(localStorage.getItem('userRole')).toBe('admin');
  });
}); 