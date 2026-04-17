const express = require('express');
const counselingController = require('../controllers/counseling.controller.js');
const { protect, requireAdmin } = require('../middleware/auth.js');

const router = express.Router();

// Public route - Submit counseling request
router.post('/', counselingController.submitCounseling);

// Protected routes (require authentication)
router.get('/user', protect, counselingController.getUserCounselings);

// Admin only routes
router.get('/stats', protect, requireAdmin, counselingController.getCounselingStats);
router.get('/', protect, requireAdmin, counselingController.getAllCounselings);
router.get('/:id', protect, counselingController.getCounselingById);
router.put('/:id/status', protect, requireAdmin, counselingController.updateCounselingStatus);
router.delete('/:id', protect, requireAdmin, counselingController.deleteCounseling);

module.exports = router;
