import { Router } from 'express';
import ApplicationController from '../controllers/applicationController';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', authenticateToken, ApplicationController.getAll);

router.post('/', authenticateToken, authorizeRoles('admin', 'coach'), ApplicationController.create);

router.patch('/:id/status', authenticateToken, authorizeRoles('admin'), ApplicationController.updateStatus);

export default router;
