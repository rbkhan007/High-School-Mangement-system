import { Router } from 'express';
import { enrollStudent, getStudents, getStudentProfile } from './student.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate, authorize('HEADMASTER'), enrollStudent);
router.get('/', authenticate, authorize('HEADMASTER', 'TEACHER'), getStudents);
router.get('/:id', authenticate, getStudentProfile);

export default router;
