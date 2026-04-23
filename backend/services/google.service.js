const { google } = require('googleapis');

// OAuth2 client configuration
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
);

// Store tokens in memory (in production, store in database)
let tokens = null;

/**
 * Get OAuth2 authorization URL
 */
const getAuthUrl = () => {
  const scopes = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
  ];

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent",
  });
};

/**
 * Get user info from Google
 */
const getUserInfo = async () => {
  if (!tokens) {
    return null;
  }

  try {
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();
    return {
      email: data.email,
      name: data.name,
      picture: data.picture,
    };
  } catch (error) {
    console.error("Error fetching user info:", error.message);
    return null;
  }
};

/**
 * Exchange authorization code for tokens
 */
const getTokensFromCode = async (code) => {
  const { tokens: newTokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(newTokens);
  tokens = newTokens;

  console.log("Google OAuth tokens obtained successfully");

  return newTokens;
};

/**
 * Set tokens (for restoring from storage)
 */
const setTokens = (storedTokens) => {
  tokens = storedTokens;
  oauth2Client.setCredentials(storedTokens);
};

/**
 * Check if authenticated
 */
const isAuthenticated = () => {
  return tokens !== null;
};

/**
 * Get current tokens
 */
const getTokens = () => tokens;

/**
 * Create a Google Calendar event with Google Meet link
 */
const createCalendarEvent = async ({
  summary,
  description,
  startDateTime,
  endDateTime,
  attendeeEmail,
}) => {
  if (!tokens) {
    throw new Error("Not authenticated with Google. Please authorize first.");
  }

  oauth2Client.setCredentials(tokens);
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const event = {
    summary: summary || "Charters Business Meeting",
    description:
      description || "Meeting scheduled via Charters Business platform",
    start: {
      dateTime: startDateTime,
      timeZone: "Asia/Kolkata",
    },
    end: {
      dateTime: endDateTime,
      timeZone: "Asia/Kolkata",
    },
    attendees: attendeeEmail ? [{ email: attendeeEmail }] : [],
    conferenceData: {
      createRequest: {
        requestId: `meeting-${Date.now()}`,
        conferenceSolutionKey: {
          type: "hangoutsMeet",
        },
      },
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: "email", minutes: 24 * 60 },
        { method: "popup", minutes: 10 },
      ],
    },
  };

  try {
    const response = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
      conferenceDataVersion: 1,
      sendUpdates: "all",
    });

    const meetLink = response.data.conferenceData?.entryPoints?.find(
      (e) => e.entryPointType === "video",
    )?.uri;

    console.log("Calendar event created successfully");

    return {
      eventId: response.data.id,
      eventLink: response.data.htmlLink,
      meetLink: meetLink || response.data.hangoutLink,
    };
  } catch (error) {
    console.error("❌ Error creating calendar event:", error.message);
    throw error;
  }
};

/**
 * Create an instant meeting (starts now)
 */
const createInstantMeeting = async ({
  summary,
  description,
  attendeeEmail,
}) => {
  const now = new Date();
  const endTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now

  return createCalendarEvent({
    summary,
    description,
    startDateTime: now.toISOString(),
    endDateTime: endTime.toISOString(),
    attendeeEmail,
  });
};

/**
 * Schedule a future meeting
 */
const scheduleCalendarMeeting = async ({
  summary,
  description,
  scheduledDate,
  scheduledTime,
  duration = 30,
  attendeeEmail,
}) => {
  const startDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
  const endDateTime = new Date(startDateTime.getTime() + duration * 60 * 1000);

  return createCalendarEvent({
    summary,
    description,
    startDateTime: startDateTime.toISOString(),
    endDateTime: endDateTime.toISOString(),
    attendeeEmail,
  });
};

/**
 * Disconnect OAuth and clear tokens
 */
const disconnectOAuth = async () => {
  if (tokens && tokens.access_token) {
    try {
      // Revoke the token with Google
      await oauth2Client.revokeToken(tokens.access_token);
      console.log("Google OAuth token revoked successfully");
    } catch (error) {
      console.error("⚠️ Error revoking token:", error.message);
      // Continue anyway to clear local tokens
    }
  }

  // Clear tokens from memory
  tokens = null;
  oauth2Client.setCredentials({});

  console.log("OAuth disconnected and tokens cleared");
  return { success: true, message: "OAuth disconnected successfully" };
};

module.exports = {
  getAuthUrl,
  getTokensFromCode,
  setTokens,
  isAuthenticated,
  getTokens,
  getUserInfo,
  createCalendarEvent,
  createInstantMeeting,
  scheduleCalendarMeeting,
  disconnectOAuth,
};
