/**
 * PEREGRINE Simulation Controller
 */

import { Request, Response, NextFunction } from 'express';
import { simulationService } from '../services/simulation.service';
import { ApiResponse, SimulationRunResponse } from '../types';

export function runSimulation(req: Request, res: Response, next: NextFunction): void {
  try {
    const payload = req.body || {};
    const result = simulationService.runSimulation(payload);

    const response: ApiResponse<SimulationRunResponse> = {
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}
