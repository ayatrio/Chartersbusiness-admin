const ProfileBranding = require('../models/ProfileBranding');

// ─── Issuer & Platform Tier Lists (mirrors frontend utility) ──────
const TIER1_ISSUERS = [
  'google', 'aws', 'amazon web services', 'microsoft', 'meta', 'facebook',
  'apple', 'ibm', 'oracle', 'cisco', 'comptia', 'pmi', 'salesforce',
  'red hat', 'vmware', 'kubernetes', 'linux foundation', 'cncf',
  'isaca', 'isc2', '(isc)²', 'ec-council', 'sans institute',
  'harvard', 'mit', 'stanford', 'yale', 'princeton', 'oxford',
  'cambridge', 'carnegie mellon', 'caltech', 'iit', 'nit',
  'databricks', 'snowflake', 'hashicorp', 'docker', 'nvidia',
  'tensorflow', 'deepmind', 'openai', 'anthropic'
];

const TIER2_ISSUERS = [
  'coursera', 'edx', 'udacity', 'linkedin learning', 'pluralsight',
  'datacamp', 'codecademy', 'freecodecamp', 'mongodb university',
  'tableau', 'atlassian', 'hubspot', 'semrush', 'hootsuite',
  'adobe', 'autodesk', 'unity', 'unreal', 'jetbrains',
  'scrum alliance', 'scrum.org', 'axelos', 'prince2', 'itil',
  'palo alto', 'fortinet', 'juniper', 'splunk', 'elastic',
  'confluent', 'cloudera', 'microsoft learn', 'aws training'
];

const TIER1_PLATFORMS = [
  'coursera', 'edx', 'mit opencourseware', 'linkedin learning',
  'pluralsight', 'udacity', 'harvard online', 'stanford online',
  'datacamp', 'oreilly', 'safari'
];

const TIER2_PLATFORMS = [
  'udemy', 'skillshare', 'codecademy', 'freecodecamp',
  'treehouse', 'frontendmasters', 'egghead', 'scrimba', 'packt'
];

const TIER1_VENUES = [
  'ieee', 'acm', 'nature', 'science', 'cell', 'lancet', 'nejm',
  'arxiv', 'neurips', 'icml', 'cvpr', 'iclr', 'aaai', 'elsevier', 'springer'
];

const TIER2_VENUES = ['researchgate', 'academia', 'ssrn', 'hindawi', 'mdpi', 'plos', 'frontiers'];


// ─── Helper Functions ─────────────────────────────────────────────
const getIssuerTier = (issuer = '') => {
  const lower = issuer.toLowerCase();
  if (TIER1_ISSUERS.some(i => lower.includes(i))) return { tier: 1, points: 6 };
  if (TIER2_ISSUERS.some(i => lower.includes(i))) return { tier: 2, points: 3 };
  return { tier: 3, points: 1 };
};

const getPlatformTier = (platform = '') => {
  const lower = platform.toLowerCase();
  if (TIER1_PLATFORMS.some(p => lower.includes(p))) return { tier: 1, points: 4 };
  if (TIER2_PLATFORMS.some(p => lower.includes(p))) return { tier: 2, points: 2 };
  return { tier: 3, points: 1 };
};

const estimateDuration = (issueDate, expiryDate, title = '') => {
  if (issueDate && expiryDate) {
    const months = (new Date(expiryDate) - new Date(issueDate)) / (1000 * 60 * 60 * 24 * 30);
    if (months >= 12) return 'long';
    if (months >= 3)  return 'medium';
    return 'short';
  }
  const lower = title.toLowerCase();
  if (['specialization','nanodegree','professional certificate','bootcamp','fellowship'].some(k => lower.includes(k))) return 'long';
  if (['workshop','webinar','crash course','intro','basics'].some(k => lower.includes(k))) return 'short';
  return 'medium';
};

const isActive = (expiryDate) => !expiryDate || new Date(expiryDate) > new Date();

const isRecent = (date) => {
  if (!date) return false;
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
  return new Date(date) >= twoYearsAgo;
};

// ─── Per-item Scorers ─────────────────────────────────────────────
const scoreCertification = (cert) => {
  let pts = 0;

  // Issuer prestige (1–6 pts)
  pts += getIssuerTier(cert.issuer).points;

  // Duration (1–3 pts)
  const dur = estimateDuration(cert.issueDate, cert.expiryDate, cert.title);
  pts += dur === 'long' ? 3 : dur === 'medium' ? 2 : 1;

  // Verifiability
  if (cert.credentialUrl) pts += 1;
  if (cert.credentialId)  pts += 1;

  // Active status
  if (isActive(cert.expiryDate)) pts += 1;

  // Recency
  if (isRecent(cert.issueDate)) pts += 1;

  // Lifetime cert bonus
  if (!cert.expiryDate && cert.issueDate) pts += 1;

  return Math.min(14, pts);
};

const scoreCourse = (course) => {
  let pts = 0;

  pts += getPlatformTier(course.platform).points;
  if (course.certificateUrl) pts += 1;

  const skillCount = Array.isArray(course.skills) ? course.skills.length : 0;
  if (skillCount >= 5)      pts += 2;
  else if (skillCount >= 2) pts += 1;

  if (isRecent(course.completionDate)) pts += 1;
  if (course.instructor)               pts += 1;

  return Math.min(9, pts);
};

const scoreResearchPaper = (paper) => {
  let pts = 0;
  const venue = (paper.platform || '').toLowerCase();

  if (TIER1_VENUES.some(v => venue.includes(v)))      pts += 6;
  else if (TIER2_VENUES.some(v => venue.includes(v))) pts += 3;
  else                                                 pts += 1;

  if (paper.url)                                  pts += 2;
  if (paper.description?.length > 50)             pts += 1;
  if (isRecent(paper.publishDate))                pts += 1;

  return Math.min(10, pts);
};

// Diminishing returns: after threshold items, extra ones give 50% value
const sumWithDiminishing = (items, scorer, maxPer, diminishAfter) =>
  items.reduce((total, item, idx) => {
    const pts = Math.min(scorer(item), maxPer);
    return total + (idx < diminishAfter ? pts : Math.round(pts * 0.5));
  }, 0);

const getNetworkingFollowersCount = (networking = {}) => (
  networking?.followersCount ?? networking?.connectionsCount ?? 0
);

const getNetworkingPostsCount = (networking = {}) => (
  networking?.postsLast60Days ?? networking?.postsShared ?? 0
);

const getNetworkingLongFormArticles = (networking = {}) => (
  networking?.longFormArticles ?? networking?.articlesPublished ?? 0
);


// ─── Main Exported Score Calculator ──────────────────────────────
exports.calculateProfileScore = (profile) => {
  const scores = {
    personalPresence:     0,
    professionalProfiles: 0,
    networking:           0,
    credentials:          0,
    thoughtLeadership:    0,
    total:                0
  };

  // ── 1. Personal Presence (max 25) ────────────────────────────────
  let pp = 0;
  if (profile.personalWebsite?.url) {
    pp += 5;
    if (profile.personalWebsite.hasAboutPage)   pp += 3;
    if (profile.personalWebsite.hasPortfolio)   pp += 5;
    if (profile.personalWebsite.hasBlog)        pp += 4;
    if (profile.personalWebsite.hasContactPage) pp += 2;
    const posts = profile.personalWebsite.blogPostCount || 0;
    if (posts >= 10) pp += 3;
    else if (posts >= 5) pp += 2;
    else if (posts >= 1) pp += 1;
  }
  if (profile.profilePicture?.isProfessional) pp += 3;
  scores.personalPresence = Math.min(25, pp);

  // ── 2. Professional Profiles (max 25) ────────────────────────────
  let prof = 0;
  if (profile.linkedIn?.profileUrl) {
    prof += 3;
    if (profile.linkedIn.hasProfilePicture)        prof += 2;
    if (profile.linkedIn.hasHeadline)              prof += 2;
    if (profile.linkedIn.aboutSectionLength > 300) prof += 3;
    else if (profile.linkedIn.aboutSectionLength > 100) prof += 1;
    if (profile.linkedIn.experienceCount >= 3)     prof += 2;
    if (profile.linkedIn.skillsCount >= 10)        prof += 2;
    if (profile.linkedIn.recommendationsCount >= 3) prof += 3;
  }
  if (profile.github?.username) {
    prof += 2;
    if ((profile.github.publicRepos || 0) >= 10)               prof += 2;
    if ((profile.github.contributionsLastYear || 0) >= 100)    prof += 2;
    if (profile.github.hasReadme)                              prof += 1;
    if ((profile.github.followers || 0) >= 50)                 prof += 1;
  }
  scores.professionalProfiles = Math.min(25, prof);

  // ── 3. Networking (max 20) ────────────────────────────────────────
  let net = 0;
  const connections = profile.networking?.connectionsCount || profile.linkedIn?.connectionsCount || 0;
  if (connections >= 500)       net += 8;
  else if (connections >= 300)  net += 6;
  else if (connections >= 100)  net += 4;
  else if (connections >= 50)   net += 2;
  if ((profile.networking?.groupsJoined      || 0) >= 5)  net += 3;
  if ((profile.networking?.postsShared       || 0) >= 10) net += 3;
  if ((profile.networking?.articlesPublished || 0) >= 3)  net += 4;
  if ((profile.networking?.engagementRate    || 0) >= 5)  net += 2;
  scores.networking = Math.min(20, net);

  // ── 4. Credentials — INTELLIGENT SCORING (max 20) ────────────────
  const certs       = profile.certifications  || [];
  const courses     = profile.courses         || [];
  const researchPubs = (profile.publications  || []).filter(p => p.publicationType === 'research');

  const certTotal    = sumWithDiminishing(certs,       scoreCertification,  14, 5);
  const courseTotal  = sumWithDiminishing(courses,     scoreCourse,          9, 5);
  const researchTotal = sumWithDiminishing(researchPubs, scoreResearchPaper, 10, 3);

  scores.credentials = Math.min(20, Math.round(certTotal + courseTotal + researchTotal));

  // ── 5. Thought Leadership (max 10) ────────────────────────────────
  let tl = 0;
  const otherPubs = (profile.publications || []).filter(p => p.publicationType !== 'research');
  if (otherPubs.length >= 5)      tl += 5;
  else if (otherPubs.length >= 3) tl += 3;
  else if (otherPubs.length >= 1) tl += 2;

  if (researchPubs.length >= 1)   tl += 3;   // research papers = strong thought leadership

  const posts = profile.personalWebsite?.blogPostCount || 0;
  if (posts >= 10)     tl += 3;
  else if (posts >= 5) tl += 2;

  if ((profile.networking?.articlesPublished || 0) >= 5) tl += 2;
  scores.thoughtLeadership = Math.min(10, tl);

  // ── Total ──────────────────────────────────────────────────────────
  scores.total =
    scores.personalPresence +
    scores.professionalProfiles +
    scores.networking +
    scores.credentials +
    scores.thoughtLeadership;

  return scores;
};

// ─── Percentile ────────────────────────────────────────────────────
exports.calculatePercentile = async (score) => {
  try {
    const total  = await ProfileBranding.countDocuments();
    if (!total) return 50;
    const lower = await ProfileBranding.countDocuments({ 'scores.total': { $lt: score } });
    return Math.round((lower / total) * 100);
  } catch {
    return 50;
  }
};