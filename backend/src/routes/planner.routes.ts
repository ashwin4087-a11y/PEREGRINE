import { Router } from 'express';
import { recommendPlan } from '../controllers/planner.controller';
import { validatePlannerPayload } from '../middleware/validator';

const router = Router();

router.post('/recommend', validatePlannerPayload, recommendPlan);

export default router;
