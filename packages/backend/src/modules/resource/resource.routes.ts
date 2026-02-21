import { Router } from 'express';
import { uploadResource, getResources } from './resource.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import multer from 'multer';

const upload = multer({ dest: 'uploads/' });
const router = Router();

router.post('/', authenticate, authorize('TEACHER'), upload.single('file'), uploadResource);
router.get('/', authenticate, getResources);

export default router;
