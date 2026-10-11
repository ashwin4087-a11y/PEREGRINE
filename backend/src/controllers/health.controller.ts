/**
 * PEREGRINE Health Controller
 */

import { Request, Response } from 'express';
import { ApiResponse, HealthResponse } from '../types';

const startTime = Date.now();

export function getHealth(_req: Request, res: Response): void {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  const memoryUsage = process.memoryUsage();
  const memoryUsageMb = Number((memoryUsage.heapUsed / 1024 / 1024).toFixed(2));

  const healthData: HealthResponse = {
    status: 'healthy',
    service: 'peregrine-backend',
    version: '2.1.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds,
    memoryUsageMb
  };

  const response: ApiResponse<HealthResponse> = {
    success: true,
    data: healthData,
    timestamp: new Date().toISOString()
  };

  res.status(200).json(response);
}
