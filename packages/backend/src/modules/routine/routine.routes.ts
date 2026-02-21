import { Router } from 'express';
import * as routineController from './routine.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, routineController.getRoutineByClass);
router.post('/', authenticate, authorize('HEADMASTER', 'TEACHER'), routineController.createRoutineItem);

export default router;
