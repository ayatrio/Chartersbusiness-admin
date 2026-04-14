const PROFILE_BRANDING_KEYS = Object.freeze([
  'linkedin',
  'website',
  'youtube',
  'socialMedia',
  'credentials',
  'github',
]);

const AI_INTERVIEW_KEYS = Object.freeze([
  'mockInterview',
  'feedbackAnalysis',
]);

const defaultPermissions = Object.freeze({
  profileBranding: Object.freeze({
    linkedin: false,
    website: false,
    youtube: false,
    socialMedia: false,
    credentials: false,
    github: false,
  }),
  aiInterview: Object.freeze({
    mockInterview: false,
    feedbackAnalysis: false,
  }),
});

const cloneDefaultPermissions = () => JSON.parse(JSON.stringify(defaultPermissions));

const toBoolean = (value) => Boolean(value);

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj || {}, key);

const getLegacyFallback = (rawProfile = {}, key) => {
  switch (key) {
    case 'linkedin':
    case 'website':
    case 'youtube':
    case 'socialMedia':
      return toBoolean(rawProfile.headlineGenerator);
    case 'credentials':
      return toBoolean(rawProfile.aboutGenerator);
    case 'github':
      return toBoolean(rawProfile.keywordOptimizer);
    default:
      return false;
  }
};

const normalizePermissions = (permissions = {}) => {
  const normalized = cloneDefaultPermissions();
  const rawProfile = permissions?.profileBranding || {};
  const rawInterview = permissions?.aiInterview || {};

  for (const key of PROFILE_BRANDING_KEYS) {
    normalized.profileBranding[key] = hasOwn(rawProfile, key)
      ? toBoolean(rawProfile[key])
      : getLegacyFallback(rawProfile, key);
  }

  for (const key of AI_INTERVIEW_KEYS) {
    normalized.aiInterview[key] = hasOwn(rawInterview, key)
      ? toBoolean(rawInterview[key])
      : false;
  }

  return normalized;
};

module.exports = {
  defaultPermissions,
  cloneDefaultPermissions,
  normalizePermissions,
};
