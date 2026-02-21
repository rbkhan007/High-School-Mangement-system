import { Router } from 'express';
import { createClass, getClasses } from './class.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate, authorize('HEADMASTER'), createClass);
router.get('/', authenticate, getClasses);

export default router;
