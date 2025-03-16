import { Request, Response, NextFunction } from 'express';

export interface ErrorResponse {
  message: string;
  code?: string;
  details?: any;
}

export class AppError extends Error {
  statusCode: number;
  code: string;
  details: any;

  constructor(message: string, statusCode: number = 500, code: string = 'SERVER_ERROR', details: any = {}) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const handleError = (error: any): ErrorResponse => {
  console.error('Error:', error);
  
  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code,
      details: error.details
    };
  }
  
  if (error.name === 'ValidationError') {
    return {
      message: 'Validation Error',
      code: 'VALIDATION_ERROR',
      details: error.errors
    };
  }
  
  if (error.name === 'MongoError' && error.code === 11000) {
    return {
      message: 'Duplicate data error',
      code: 'DUPLICATE_ERROR',
      details: error.keyValue
    };
  }
  
  // Handle other specific error types
  if (error.name === 'JsonWebTokenError') {
    return {
      message: 'Invalid token',
      code: 'INVALID_TOKEN'
    };
  }
  
  if (error.name === 'TokenExpiredError') {
    return {
      message: 'Token expired',
      code: 'TOKEN_EXPIRED'
    };
  }
  
  return {
    message: error.message || 'Internal Server Error',
    code: 'SERVER_ERROR'
  };
};

export const errorMiddleware = (err: any, req: Request, res: Response, next: NextFunction): void => {
  const error = handleError(err);
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  
  res.status(statusCode).json(error);
};
