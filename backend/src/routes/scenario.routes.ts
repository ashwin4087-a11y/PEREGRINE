import { Router } from 'express';
import { 
  getScenarios, 
  getScenarioById, 
  getComponents, 
  getInitialConfig 
} from '../controllers/scenario.controller';

const router = Router();

router.get('/', getScenarios);
router.get('/components', getComponents);
router.get('/config', getInitialConfig);
router.get('/:id', getScenarioById);

export default router;
