import { Router } from 'express';
import { submitGrievance, updateGrievanceStatus } from './grievance.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate, authorize('STUDENT'), submitGrievance);
router.put('/:id', authenticate, authorize('COMMITTEE'), updateGrievanceStatus);

export default router;
