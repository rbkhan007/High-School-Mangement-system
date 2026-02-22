import { Router } from 'express';
import { getDashboardStats } from './parent.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();

router.get('/dashboard', authenticate, authorize('PARENT'), getDashboardStats);

export default router;
