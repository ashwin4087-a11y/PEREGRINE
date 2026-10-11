/**
 * PEREGRINE Scenario Controller
 */

import { Request, Response, NextFunction } from 'express';
import { scenarioService } from '../services/scenario.service';
import { ApiResponse } from '../types';
import { AppError } from '../middleware/errorHandler';

export function getScenarios(_req: Request, res: Response): void {
  const scenarios = scenarioService.getScenarios();
  const response: ApiResponse = {
    success: true,
    data: scenarios,
    timestamp: new Date().toISOString()
  };
  res.status(200).json(response);
}

export function getScenarioById(req: Request, res: Response, next: NextFunction): void {
  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : (rawId as string);
  const scenario = scenarioService.getScenarioById(id);

  if (!scenario) {
    return next(new AppError(`Scenario "${id}" not found`, 404));
  }

  const response: ApiResponse = {
    success: true,
    data: scenario,
    timestamp: new Date().toISOString()
  };
  res.status(200).json(response);
}

export function getComponents(_req: Request, res: Response): void {
  const components = scenarioService.getInfrastructureComponents();
  const response: ApiResponse = {
    success: true,
    data: components,
    timestamp: new Date().toISOString()
  };
  res.status(200).json(response);
}

export function getInitialConfig(_req: Request, res: Response): void {
  const config = scenarioService.getInitialConfig();
  const response: ApiResponse = {
    success: true,
    data: config,
    timestamp: new Date().toISOString()
  };
  res.status(200).json(response);
}
