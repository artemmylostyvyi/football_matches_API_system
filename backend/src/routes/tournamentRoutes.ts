import { Router } from 'express';
import TournamentController from '../controllers/tournamentController';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', TournamentController.getAll);
router.get('/:id', TournamentController.getById);

router.post('/', authenticateToken, authorizeRoles('admin', 'coach'), TournamentController.create);

export default router;
