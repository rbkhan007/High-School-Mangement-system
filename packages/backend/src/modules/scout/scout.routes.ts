import { Router } from 'express';
import {
    registerScout,
    getScoutProfile,
    getAllScouts,
    updateScoutProfile,
    deleteScoutMember
} from './scout.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();

// Register a scout (Headmaster or Teacher)
router.post('/', authenticate, authorize('HEADMASTER', 'TEACHER'), registerScout);

// Get all scouts (Headmaster or Teacher)
router.get('/', authenticate, authorize('HEADMASTER', 'TEACHER'), getAllScouts);

// Get specific scout profile (Anyone authenticated)
router.get('/:student_id', authenticate, getScoutProfile);

// Update scout profile (Headmaster or Teacher)
router.patch('/:student_id', authenticate, authorize('HEADMASTER', 'TEACHER'), updateScoutProfile);

// Remove scout member (Headmaster)
router.delete('/:student_id', authenticate, authorize('HEADMASTER'), deleteScoutMember);

export default router;
