import { Router } from 'express';
import { createNotice, getNotices } from './notice.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate, authorize('HEADMASTER'), createNotice);
router.get('/', authenticate, getNotices);

export default router;
