const express = require('express');
const router = express.Router();
const MatchController = require('../controllers/matchController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

router.get('/', MatchController.getAll);
router.get('/:id', MatchController.getById);

router.post(
  '/',
  authenticateToken,
  authorizeRoles('admin'),
  MatchController.create
);

router.patch(
  '/:id/result',
  authenticateToken,
  authorizeRoles('admin'),
  MatchController.updateResult
);

module.exports = router;