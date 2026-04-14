export const PROFILE_BRANDING_PERMISSION_TEMPLATE = Object.freeze({
  linkedin: false,
  website: false,
  youtube: false,
  socialMedia: false,
  credentials: false,
  github: false,
});

export const AI_INTERVIEW_PERMISSION_TEMPLATE = Object.freeze({
  mockInterview: false,
  feedbackAnalysis: false,
});

export const PROFILE_BRANDING_PERMISSION_LABELS = Object.freeze({
  linkedin: 'LinkedIn',
  website: 'Website',
  youtube: 'YouTube',
  socialMedia: 'Social Media',
  credentials: 'Credentials',
  github: 'GitHub',
});

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj || {}, key);

const legacyProfileFallback = (rawProfile, key) => {
  switch (key) {
    case 'linkedin':
    case 'website':
    case 'youtube':
    case 'socialMedia':
      return Boolean(rawProfile?.headlineGenerator);
    case 'credentials':
      return Boolean(rawProfile?.aboutGenerator);
    case 'github':
      return Boolean(rawProfile?.keywordOptimizer);
    default:
      return false;
  }
};

export const normalizeProfileBrandingPermissions = (rawProfile = {}) => {
  const normalized = { ...PROFILE_BRANDING_PERMISSION_TEMPLATE };

  Object.keys(PROFILE_BRANDING_PERMISSION_TEMPLATE).forEach((key) => {
    normalized[key] = hasOwn(rawProfile, key)
      ? Boolean(rawProfile[key])
      : legacyProfileFallback(rawProfile, key);
  });

  return normalized;
};

export const normalizeAiInterviewPermissions = (rawInterview = {}) => {
  const normalized = { ...AI_INTERVIEW_PERMISSION_TEMPLATE };

  Object.keys(AI_INTERVIEW_PERMISSION_TEMPLATE).forEach((key) => {
    normalized[key] = hasOwn(rawInterview, key)
      ? Boolean(rawInterview[key])
      : false;
  });

  return normalized;
};

export const normalizePermissions = (permissions = {}) => ({
  profileBranding: normalizeProfileBrandingPermissions(permissions.profileBranding || {}),
  aiInterview: normalizeAiInterviewPermissions(permissions.aiInterview || {}),
});

export const hasProfileBrandingAccess = (permissions = {}, feature) => (
  Boolean(normalizeProfileBrandingPermissions(permissions)[feature])
);

