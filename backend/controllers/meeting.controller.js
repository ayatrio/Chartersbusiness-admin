const Meeting = require("../models/Meeting.model.js");
const googleService = require("../services/google.service.js");
const emailService = require("../services/email.service.js");
const asyncHandler = require("../utils/asyncHandler.js");
const ApiError = require("../utils/ApiError.js");
const ApiResponse = require("../utils/ApiResponse.js");

/**
 * Get Google OAuth URL for authorization
 */
const getOAuthUrl = asyncHandler(async (req, res) => {
  const authUrl = googleService.getAuthUrl();
  res
    .status(200)
    .json(new ApiResponse(200, { authUrl }, "Authorization URL generated"));
});

/**
 * Handle OAuth callback
 */
const handleOAuthCallback = asyncHandler(async (req, res) => {
  const { code } = req.query;

  if (!code) {
    throw new ApiError(400, "Authorization code is required");
  }

  await googleService.getTokensFromCode(code);

  // Return HTML that closes the popup and notifies the parent window
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Authorization Successful</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #B30437 0%, #8B0329 100%);
            color: white;
          }
          .container {
            text-align: center;
            padding: 40px;
          }
          .checkmark {
            font-size: 64px;
            margin-bottom: 20px;
          }
          h1 { margin: 0 0 10px; font-size: 24px; }
          p { margin: 0; opacity: 0.9; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="checkmark">✓</div>
          <h1>Connected Successfully!</h1>
          <p>You can close this window now.</p>
        </div>
        <script>
          // Notify parent window and close
          if (window.opener) {
            window.opener.postMessage({ type: 'OAUTH_SUCCESS' }, '*');
          }
          setTimeout(() => window.close(), 1500);
        </script>
      </body>
    </html>
  `);
});

/**
 * Check if Google OAuth is connected
 */
const checkOAuthStatus = asyncHandler(async (req, res) => {
  const isConnected = googleService.isAuthenticated();
  let userInfo = null;

  if (isConnected) {
    userInfo = await googleService.getUserInfo();
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, { isConnected, userInfo }, "OAuth status checked"),
    );
});

/**
 * Disconnect Google OAuth
 */
const disconnectOAuth = asyncHandler(async (req, res) => {
  const result = await googleService.disconnectOAuth();

  res
    .status(200)
    .json(new ApiResponse(200, result, "OAuth disconnected successfully"));
});

/**
 * Create an instant meeting (Call Now)
 * Uses a fixed Google Meet link from environment variable
 */
const createInstantMeeting = asyncHandler(async (req, res) => {
  const { hostName, hostEmail, subject, description } = req.body;

  if (!hostName || !hostEmail) {
    throw new ApiError(400, "Host name and email are required");
  }

  // Use fixed Google Meet link from environment variable
  const meetingLink =
    process.env.INSTANT_CALL_MEET_LINK || "https://meet.google.com/new";

  if (!process.env.INSTANT_CALL_MEET_LINK) {
    console.log(
      "⚠️ INSTANT_CALL_MEET_LINK not set in .env. Using fallback meet.google.com/new",
    );
  }

  // Save to database
  const meeting = await Meeting.create({
    meetingType: "instant",
    hostName,
    hostEmail,
    meetingLink,
    subject: subject || "Instant Meeting",
    description,
    status: "waiting",
  });

  // Send notification to admin
  await emailService.sendInstantMeetingNotification({
    hostName,
    hostEmail,
    meetingLink,
    meetingNumber: meeting.meetingNumber,
  });

  res.status(201).json(
    new ApiResponse(
      201,
      {
        meeting,
        meetingLink,
      },
      "Instant meeting created successfully",
    ),
  );
});

/**
 * Schedule a meeting for later
 */
const scheduleMeeting = asyncHandler(async (req, res) => {
  const {
    hostName,
    hostEmail,
    scheduledDate,
    scheduledTime,
    duration = 30,
    subject,
    description,
  } = req.body;

  if (!hostName || !hostEmail || !scheduledDate || !scheduledTime) {
    throw new ApiError(400, "Host name, email, date and time are required");
  }

  let meetingLink;
  let calendarEventId;

  // Check if Google OAuth is connected
  if (googleService.isAuthenticated()) {
    try {
      const calendarResult = await googleService.scheduleCalendarMeeting({
        summary: subject || `Meeting with ${hostName}`,
        description: description || `Scheduled meeting with ${hostName}`,
        scheduledDate,
        scheduledTime,
        duration,
        attendeeEmail: process.env.ADMIN_EMAIL,
      });
      meetingLink = calendarResult.meetLink;
      calendarEventId = calendarResult.eventId;
    } catch (error) {
      console.error("Failed to create calendar event:", error.message);
      // Fallback
      meetingLink = "https://meet.google.com/new";
    }
  } else {
    meetingLink = "https://meet.google.com/new";
    console.log(
      "⚠️ Google OAuth not connected. Using fallback meet.google.com/new",
    );
  }

  // Save to database
  const meeting = await Meeting.create({
    meetingType: "scheduled",
    hostName,
    hostEmail,
    meetingLink,
    calendarEventId,
    scheduledDate: new Date(scheduledDate),
    scheduledTime,
    duration,
    subject: subject || "Scheduled Meeting",
    description,
    status: "scheduled",
  });

  // Send confirmation email
  await emailService.sendScheduledMeetingConfirmation({
    hostName,
    hostEmail,
    meetingLink,
    meetingNumber: meeting.meetingNumber,
    scheduledDate,
    scheduledTime,
    subject: subject || "Scheduled Meeting",
  });

  res.status(201).json(
    new ApiResponse(
      201,
      {
        meeting,
        meetingLink,
      },
      "Meeting scheduled successfully",
    ),
  );
});

/**
 * Get all meetings (admin)
 */
const getAllMeetings = asyncHandler(async (req, res) => {
  const { status, type, page = 1, limit = 20 } = req.query;

  const query = {};
  if (status) query.status = status;
  if (type) query.meetingType = type;

  const meetings = await Meeting.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Meeting.countDocuments(query);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        meetings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
      "Meetings fetched successfully",
    ),
  ).limit(parseInt(limit))
});

/**
 * Get meeting by ID
 */
const getMeetingById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const meeting = await Meeting.findById(id);
  if (!meeting) {
    throw new ApiError(404, "Meeting not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, { meeting }, "Meeting fetched successfully"));
});

/**
 * Update meeting status
 */
const updateMeetingStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = [
    "waiting",
    "scheduled",
    "in-progress",
    "completed",
    "cancelled",
  ];
  if (!validStatuses.includes(status)) {
    throw new ApiError(
      400,
      `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
    );
  }

  const meeting = await Meeting.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true },
  );

  if (!meeting) {
    throw new ApiError(404, "Meeting not found");
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, { meeting }, "Meeting status updated successfully"),
    );
});

module.exports = {
  getOAuthUrl,
  handleOAuthCallback,
  checkOAuthStatus,
  disconnectOAuth,
  createInstantMeeting,
  scheduleMeeting,
  getAllMeetings,
  getMeetingById,
  updateMeetingStatus,
};
