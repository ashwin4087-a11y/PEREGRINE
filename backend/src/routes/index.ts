import { Router } from 'express';
import healthRoutes from './health.routes';
import scenarioRoutes from './scenario.routes';
import simulationRoutes from './simulation.routes';
import redundancyRoutes from './redundancy.routes';
import plannerRoutes from './planner.routes';
import experimentRoutes from './experiment.routes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/scenarios', scenarioRoutes);
router.use('/simulations', simulationRoutes);
router.use('/redundancy', redundancyRoutes);
router.use('/planner', plannerRoutes);
router.use('/experiments', experimentRoutes);

export default router;
