import axios, { AxiosInstance, AxiosError } from 'axios';

interface ApiConfig {
  baseURL: string;
  auth: {
    baseURL: string;
    loginService: string;
    registerService: string;
  };
}

interface ApiError {
  message: string;
  status?: number;
  code?: string;
  data?: any;
}

// Configure base URLs for different services
const API_CONFIG: ApiConfig = {
  // Default API URL
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  
  // Auth service endpoints
  auth: {
    // This is a unified auth API endpoint that will proxy to the correct service
    baseURL: '/api/auth',
    
    // Only use these direct URLs if necessary for specific service calls
    loginService: process.env.NEXT_PUBLIC_LOGIN_SERVICE_URL || 'http://localhost:3005',
    registerService: process.env.NEXT_PUBLIC_REGISTER_SERVICE_URL || 'http://localhost:3007'
  }
};

// Create axios instances for different services
const api: AxiosInstance = axios.create({
  baseURL: API_CONFIG.baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

const authApi: AxiosInstance = axios.create({
  baseURL: API_CONFIG.auth.baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Error handler function
const handleApiError = (error: AxiosError): ApiError => {
  if (error.response) {
    // The server responded with a status code outside the 2xx range
    return {
      message: error.response.data?.message || 'An error occurred',
      status: error.response.status,
      code: error.response.data?.code,
      data: error.response.data
    };
  } else if (error.request) {
    // The request was made but no response was received
    return {
      message: 'No response received from server',
      status: 0
    };
  } else {
    // Something else caused the error
    return {
      message: error.message || 'An unexpected error occurred',
      status: 0
    };
  }
};

// Add response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    const apiError = handleApiError(error);
    console.error('API Error:', apiError);
    return Promise.reject(apiError);
  }
);

authApi.interceptors.response.use(
  response => response,
  error => {
    const apiError = handleApiError(error);
    console.error('Auth API Error:', apiError);
    return Promise.reject(apiError);
  }
);

// Add request interceptor for token handling
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

authApi.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

export { api, authApi, API_CONFIG };
export type { ApiConfig, ApiError }; 