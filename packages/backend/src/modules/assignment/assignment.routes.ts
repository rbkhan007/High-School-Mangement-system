import { Router } from 'express';
import { createAssignment, getAssignmentsByClass, deleteAssignment } from './assignment.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate, authorize('TEACHER', 'HEADMASTER'), createAssignment);
router.get('/class/:class_name', authenticate, getAssignmentsByClass);
router.delete('/:id', authenticate, authorize('TEACHER', 'HEADMASTER'), deleteAssignment);

export default router;
