const express = require('express');
const router = express.Router();

const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  exchangeCode,
  redirectCode
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Login and Register moved to USERS REPO
router.get('/me', protect, getMe);
router.put('/update-profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.post('/redirect-code', protect, redirectCode);
router.post('/exchange-code', exchangeCode);

module.exports = router;
