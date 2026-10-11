/**
 * PEREGRINE Backend Request Validation Helper
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

export function validatePlannerPayload(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const { budget, fairnessFloor } = req.body || {};

  if (budget === undefined || budget === null) {
    return next(new AppError('Field "budget" is required', 400));
  }

  const numBudget = Number(budget);
  if (isNaN(numBudget) || numBudget < 0) {
    return next(new AppError('"budget" must be a non-negative number', 400));
  }

  if (fairnessFloor !== undefined && fairnessFloor !== null) {
    const numFloor = Number(fairnessFloor);
    if (isNaN(numFloor) || numFloor < 0 || numFloor > 100) {
      return next(new AppError('"fairnessFloor" must be a number between 0 and 100', 400));
    }
  }

  next();
}

export function validateExperimentPayload(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const { seed } = req.body || {};

  if (!seed || typeof seed !== 'string' || seed.trim() === '') {
    return next(new AppError('Field "seed" is required and must be a non-empty string', 400));
  }

  next();
}
