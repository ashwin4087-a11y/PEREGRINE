/**
 * PEREGRINE Experiment Controller
 */

import { Request, Response, NextFunction } from 'express';
import { experimentService } from '../services/experiment.service';
import { ApiResponse, ExperimentRunResponse } from '../types';

export function runExperiment(req: Request, res: Response, next: NextFunction): void {
  try {
    const payload = req.body || {};
    const result = experimentService.runExperiment(payload);

    const response: ApiResponse<ExperimentRunResponse> = {
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}
