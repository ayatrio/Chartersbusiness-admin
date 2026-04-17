const express = require('express');
const jobApplicationController = require('../controllers/jobApplication.controller.js');
const { protect, requireAdmin } = require('../middleware/auth.js');
const upload = require('../middleware/upload.js');

const router = express.Router();

// Protected route - Apply for job/internship (User must be logged in)
router.post(
  "/apply/:type/:id",
  protect,
  upload.single('resume'),
  jobApplicationController.applyForPosition
);

// Protected route - Get my applications
router.get("/my", protect, jobApplicationController.getMyApplications);

// Protected route - Get single application
router.get("/:id", protect, jobApplicationController.getApplicationById);

// Admin/Recruiter routes
router.get(
  "/",
  protect,
  requireAdmin,
  jobApplicationController.getAllApplications
);

router.put(
  "/:id/status",
  protect,
  requireAdmin,
  jobApplicationController.updateApplicationStatus
);

router.delete(
  "/:id",
  protect,
  requireAdmin,
  jobApplicationController.deleteApplication
);

// Admin only - Statistics
router.get(
  "/admin/stats",
  protect,
  requireAdmin,
  jobApplicationController.getApplicationStats
);
router.get(
  "/:id/applications",
  protect,
  requireAdmin,
  jobApplicationController.getAllApplicationsForAdmin
);

module.exports = router;
