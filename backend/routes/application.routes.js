const express = require('express');
const applicationController = require('../controllers/application.controller.js');
const { protect, requireAdmin } = require('../middleware/auth.js');

const router = express.Router();

// Public route - Submit application
router.post('/', applicationController.submitApplication);

// Protected routes (require authentication)
router.get('/user', protect, applicationController.getUserApplications);

// Public route - Get application by application number
router.get('/number/:applicationNumber', applicationController.getApplicationByNumber);

// Admin only routes
router.get('/stats', protect, requireAdmin, applicationController.getApplicationStats);
router.get('/', protect, requireAdmin, applicationController.getAllApplications);
router.get('/:id', protect, applicationController.getApplicationById);
router.put('/:id/status', protect, requireAdmin, applicationController.updateApplicationStatus);
router.delete('/:id', protect, requireAdmin, applicationController.deleteApplication);

module.exports = router;
