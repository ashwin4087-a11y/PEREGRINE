/**
 * PEREGRINE Redundancy Controller
 */

import { Request, Response, NextFunction } from 'express';
import { redundancyService } from '../services/redundancy.service';
import { ApiResponse, RedundancyAnalyzeResponse } from '../types';

export function analyzeRedundancy(req: Request, res: Response, next: NextFunction): void {
  try {
    const payload = req.body || {};
    const result = redundancyService.analyzeRedundancy(payload);

    const response: ApiResponse<RedundancyAnalyzeResponse> = {
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}
