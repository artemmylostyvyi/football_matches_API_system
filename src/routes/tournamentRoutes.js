const express = require('express');
const router = express.Router();
const TournamentController = require('../controllers/tournamentController');

// Import middleware
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

router.get('/', TournamentController.getAll);
router.get('/:id', TournamentController.getById);

router.post(
  '/',
  authenticateToken,                // 1) check if token is correct
  authorizeRoles('admin', 'coach'), // 2) check the role
  TournamentController.create       // 3) create in controller
);

module.exports = router;