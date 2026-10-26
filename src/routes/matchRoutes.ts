import { Router } from 'express';
import MatchController from '../controllers/matchController';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', MatchController.getAll);
router.get('/:id', MatchController.getById);

router.post('/', authenticateToken, authorizeRoles('admin'), MatchController.create);

router.patch('/:id/result', authenticateToken, authorizeRoles('admin'), MatchController.updateResult);

export default router;
