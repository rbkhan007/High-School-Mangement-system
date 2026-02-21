import { Router } from 'express';
import { getTeachers, addTeacher, applyLeave } from './teacher.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, authorize('HEADMASTER'), getTeachers);
router.post('/', authenticate, authorize('HEADMASTER'), addTeacher);
router.post('/leave', authenticate, authorize('TEACHER'), applyLeave);

export default router;
