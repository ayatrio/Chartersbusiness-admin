const express = require('express');

const {
  login,
  getMe,
} = require('../controllers/adminAuthController');
const {
  protect,
  requireAdmin,
} = require('../middleware/auth');

const router = express.Router();

// Admin login moved to USERS REPO
router.get('/me', protect, requireAdmin, getMe);

module.exports = router;
