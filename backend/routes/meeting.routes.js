const express = require('express');
const {
  getOAuthUrl,
  handleOAuthCallback,
  checkOAuthStatus,
  disconnectOAuth,
  createInstantMeeting,
  scheduleMeeting,
  getAllMeetings,
  getMeetingById,
  updateMeetingStatus,
} = require('../controllers/meeting.controller.js');
const { protect, requireAdmin } = require('../middleware/auth.js');

const router = express.Router();

// OAuth routes (Admin restricted)
router.get("/oauth/url", protect, requireAdmin, getOAuthUrl);
router.get("/oauth/callback", handleOAuthCallback);
router.get("/oauth/status", protect, requireAdmin, checkOAuthStatus);
router.post("/oauth/disconnect", protect, requireAdmin, disconnectOAuth);

// Meeting routes
router.post("/instant", protect, createInstantMeeting);
router.post("/schedule", protect, scheduleMeeting);
router.get("/", protect, requireAdmin, getAllMeetings);
router.get("/:id", protect, getMeetingById);
router.put("/:id/status", protect, requireAdmin, updateMeetingStatus);

module.exports = router;
