import { Router } from 'express';
import { createExam, enterMarks, getResults } from './exam.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate, authorize('HEADMASTER'), createExam);
router.post('/:exam_id/marks', authenticate, authorize('TEACHER', 'HEADMASTER'), enterMarks);
router.get('/results', authenticate, getResults);

export default router;
