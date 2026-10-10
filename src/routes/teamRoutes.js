const express = require('express');
const router = express.Router();
const TeamController = require('../controllers/teamController');

const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

// public routes
router.get('/', TeamController.getAll);
router.get('/:id', TeamController.getById);

router.post(
  '/',
  authenticateToken,
  authorizeRoles('admin', 'coach'),
  TeamController.create
);

module.exports = router;