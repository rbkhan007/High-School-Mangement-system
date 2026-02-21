import { Router } from 'express';
import { submitFeedback, getAllFeedback } from './feedback.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();

router.post('/', submitFeedback);
router.get('/', authenticate, authorize('HEADMASTER'), getAllFeedback);

export default router;
