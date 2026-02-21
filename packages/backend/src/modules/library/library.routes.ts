import { Router } from 'express';
import { addBook, getBooks, borrowBook, returnBook } from './library.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, getBooks);
router.post('/', authenticate, authorize('HEADMASTER', 'TEACHER'), addBook);
router.post('/borrow', authenticate, authorize('HEADMASTER', 'TEACHER'), borrowBook);
router.post('/return/:record_id', authenticate, authorize('HEADMASTER', 'TEACHER'), returnBook);

export default router;
