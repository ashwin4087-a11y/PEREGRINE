import { Router } from 'express';
import { runExperiment } from '../controllers/experiment.controller';
import { validateExperimentPayload } from '../middleware/validator';

const router = Router();

router.post('/run', validateExperimentPayload, runExperiment);

export default router;
