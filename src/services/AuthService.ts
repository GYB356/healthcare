import { authApi } from '@/utils/apiConfig';
import { User, AuthResponse, LoginData, RegisterData, TokenResponse, AuthError } from '@/types/auth';

class AuthService {
  /**
   * Register a new user
   * @param userData - User registration data
   * @returns Promise with user data and tokens
   */
  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const response = await authApi.post<AuthResponse>('/register', userData);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Log in a user
   * @param email - User email
   * @param password - User password
   * @param twoFactorCode - Optional 2FA code
   * @returns Promise with user data and tokens
   */
  async login(email: string, password: string, twoFactorCode?: string): Promise<AuthResponse> {
    try {
      const loginData: LoginData = { email, password };
      if (twoFactorCode) {
        loginData.twoFactorCode = twoFactorCode;
      }
      
      const response = await authApi.post<AuthResponse>('/login', loginData);
      
      if (response.data.token) {
        this.setUserData(response.data);
      }
      
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Log out the current user
   */
  logout(): void {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  }

  /**
   * Get the current user from local storage
   * @returns Current user data or null
   */
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Refresh the authentication token
   * @param refreshToken - The refresh token
   * @returns Promise with new tokens
   */
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    try {
      const response = await authApi.post<TokenResponse>('/refresh-token', { refreshToken });
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Set user data in local storage
   * @param data - User data and tokens
   */
  private setUserData(data: AuthResponse): void {
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('token', data.token);
    localStorage.setItem('refreshToken', data.refreshToken);
  }

  /**
   * Handle API errors
   * @param error - The error object
   */
  private handleError(error: unknown): never {
    if (error instanceof Error) {
      const authError: AuthError = {
        message: error.message,
        status: (error as any).status,
        code: (error as any).code
      };
      throw authError;
    }
    throw new Error('An unexpected error occurred');
  }
}

export default new AuthService(); 