/**
 * PEREGRINE Planner Controller
 */

import { Request, Response, NextFunction } from 'express';
import { plannerService } from '../services/planner.service';
import { ApiResponse, PlannerRecommendResponse } from '../types';

export function recommendPlan(req: Request, res: Response, next: NextFunction): void {
  try {
    const payload = req.body || {};
    const result = plannerService.recommendPlan(payload);

    const response: ApiResponse<PlannerRecommendResponse> = {
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}
