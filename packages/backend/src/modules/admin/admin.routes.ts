import { Router } from 'express';
import { getEntityData, updateEntityRecord, batchUpdateEntity, getDashboardStats } from './admin.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();

// All routes require Headmaster role
router.use(authenticate, authorize('HEADMASTER'));

router.get('/stats', getDashboardStats);
router.get('/:entity', getEntityData);
router.put('/:entity/:id', updateEntityRecord);
router.patch('/:entity/batch', batchUpdateEntity);

export default router;
