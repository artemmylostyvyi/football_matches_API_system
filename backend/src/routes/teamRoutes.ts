import { Router } from 'express';
import TeamController from '../controllers/teamController';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware';

const router = Router();

// public routes
router.get('/', TeamController.getAll);
router.get('/:id', TeamController.getById);

router.post('/', authenticateToken, authorizeRoles('admin', 'coach'), TeamController.create);

export default router;
