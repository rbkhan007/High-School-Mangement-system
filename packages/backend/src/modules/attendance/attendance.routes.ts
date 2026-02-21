import { Router } from 'express';
import { markAttendance, getAttendanceReport } from './attendance.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate, authorize('TEACHER', 'HEADMASTER'), markAttendance);
router.get('/reports', authenticate, getAttendanceReport);

export default router;
