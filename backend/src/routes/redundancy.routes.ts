import { Router } from 'express';
import { analyzeRedundancy } from '../controllers/redundancy.controller';

const router = Router();

router.post('/analyze', analyzeRedundancy);

export default router;
