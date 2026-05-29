const express = require('express');
const applicationController = require('../controllers/application.controller.js');
const { protect, requireAdmin } = require('../middleware/auth.js');
const upload = require('../middleware/upload.js');

const router = express.Router();

// ── Public routes ─────────────────────────────────────────────
router.get('/number/:applicationNumber', applicationController.getApplicationByNumber);

// ── Authenticated routes ──────────────────────────────────────
router.post('/',    protect, applicationController.submitApplication);
router.get('/user', protect, applicationController.getUserApplications);

// ── Admin routes ──────────────────────────────────────────────
router.get('/stats', protect, requireAdmin, applicationController.getApplicationStats);
router.get('/',      protect, requireAdmin, applicationController.getAllApplications);

// ── Per-application routes ────────────────────────────────────
router.get('/:id',        protect, applicationController.getApplicationById);
router.put('/:id/status', protect, requireAdmin, applicationController.updateApplicationStatus);
router.delete('/:id',     protect, requireAdmin, applicationController.deleteApplication);

// ── Multi-step form routes ────────────────────────────────────
router.put('/:id/personal',  protect, applicationController.updatePersonal);
router.put('/:id/academics', protect, applicationController.updateAcademics);
router.put('/:id/documents', protect,
  upload.fields([
    { name: 'photoId',   maxCount: 1 },
    { name: 'marksheet', maxCount: 1 },
    { name: 'photo',     maxCount: 1 },
    { name: 'workProof', maxCount: 1 },
  ]),
  applicationController.updateDocuments
);
router.put('/:id/payment', protect, applicationController.updatePayment);

module.exports = router;