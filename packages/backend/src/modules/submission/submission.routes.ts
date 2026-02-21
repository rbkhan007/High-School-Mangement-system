import { Router } from 'express';
import { submitAssignment, getSubmissionsByAssignment, gradeSubmission } from './submission.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate, authorize('STUDENT'), submitAssignment);
router.get('/assignment/:assignment_id', authenticate, authorize('TEACHER', 'HEADMASTER'), getSubmissionsByAssignment);
router.patch('/:id/grade', authenticate, authorize('TEACHER', 'HEADMASTER'), gradeSubmission);

export default router;
