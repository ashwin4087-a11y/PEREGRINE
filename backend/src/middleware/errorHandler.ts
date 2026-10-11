/**
 * PEREGRINE Backend Centralized Error Handler
 * Standardizes all error responses to predictable ApiResponse format.
 */

import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

export class AppError extends Error {
  public statusCode: number;
  public details?: any;

  constructor(message: string, statusCode: number = 500, details?: any) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || (err.status ? Number(err.status) : 500);
  const message = err.message || 'Internal Server Error';

  console.error(`[API Error ${statusCode}]:`, err);

  const response: ApiResponse = {
    success: false,
    error: message,
    data: err.details,
    timestamp: new Date().toISOString()
  };

  res.status(statusCode).json(response);
}
