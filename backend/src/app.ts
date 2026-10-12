/**
 * PEREGRINE Backend Express Application
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { SERVER_CONFIG } from './config';
import apiRoutes from './routes';
import { errorHandler, AppError } from './middleware/errorHandler';

export function createApp() {
  const app = express();

  // CORS restricted to frontend origin with localhost flexibility
  const allowedOrigins = [
    SERVER_CONFIG.frontendUrl,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173'
  ];

  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new AppError(`Origin ${origin} not allowed by CORS`, 403));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }));

  // Body parser
  app.use(express.json());

  // Mount API router under /api
  app.use(SERVER_CONFIG.apiPrefix, apiRoutes);

  // Root welcome endpoint
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      name: 'PEREGRINE Disaster-Resilient Broadcast Network API',
      version: '2.1.0',
      status: 'operational',
      docs: '/api/health'
    });
  });

  // Catch-all 404 handler
  app.use((req: Request, _res: Response, next: NextFunction) => {
    next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404));
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}

export default createApp();
