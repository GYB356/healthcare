export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface LoginData {
  email: string;
  password: string;
  twoFactorCode?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface TokenResponse {
  token: string;
  refreshToken: string;
}

export interface AuthError {
  message: string;
  code?: string;
  status?: number;
} 