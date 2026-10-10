const express = require('express');
const router = express.Router();
const ApplicationController = require('../controllers/applicationController');

const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

router.get('/', authenticateToken, ApplicationController.getAll);

router.post(
  '/',
  authenticateToken,
  authorizeRoles('admin', 'coach'),
  ApplicationController.create
);

router.patch(
  '/:id/status',
  authenticateToken,
  authorizeRoles('admin'),
  ApplicationController.updateStatus
);

module.exports = router;