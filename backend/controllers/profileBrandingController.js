const ProfileBranding = require('../models/ProfileBranding');
const scoringService = require('../services/scoringService');
const suggestionService = require('../services/suggestionService');
const githubService = require('../services/githubService');
const linkedinScraperService = require('../services/linkedinScraperService');
const linkedinScraperJobQueue = require('../services/linkedinScraperJobQueue');
const websiteVerificationService = require('../services/websiteVerificationService');
const youtubeService = require('../services/youtubeService');

const normalizeGithubUsername = (value) => {
  let normalized = (value || '').trim();

  if (!normalized) return '';

  normalized = normalized.replace(/^https?:\/\/(www\.)?github\.com\//i, '');
  normalized = normalized.replace(/^(www\.)?github\.com\//i, '');
  normalized = normalized.replace(/^@/, '');
  normalized = normalized.split(/[/?#]/)[0].trim();

  return normalized;
};

const isValidGithubUsername = (value) => (
  /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(value)
);

const getNumberOrFallback = (value, fallback = 0) => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const getNetworkingFollowersCount = (networking = {}) => (
  getNumberOrFallback(
    networking.followersCount,
    getNumberOrFallback(networking.connectionsCount, 0)
  )
);

const getNetworkingPostsCount = (networking = {}) => (
  getNumberOrFallback(
    networking.postsLast60Days,
    getNumberOrFallback(networking.postsShared, 0)
  )
);

const getNetworkingLongFormArticles = (networking = {}) => (
  getNumberOrFallback(
    networking.longFormArticles,
    getNumberOrFallback(networking.articlesPublished, 0)
  )
);

// @desc    Get profile branding score
// @route   GET /api/profile-branding/score
// @access  Private
exports.getProfileScore = async (req, res, next) => {
  try {
    let profile = await ProfileBranding.findOne({ userId: req.user.id });

    if (!profile) {
      // Create new profile if doesn't exist
      profile = await ProfileBranding.create({ userId: req.user.id });
    }

    res.status(200).json({
      success: true,
      profile
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Calculate/Recalculate profile score
// @route   POST /api/profile-branding/calculate
// @access  Private
exports.calculateScore = async (req, res, next) => {
  try {
    let profile = await ProfileBranding.findOne({ userId: req.user.id });

    if (!profile) {
      profile = await ProfileBranding.create({ userId: req.user.id });
    }

    // Calculate scores using scoring service
    const scores = scoringService.calculateProfileScore(profile);
    
    // Calculate percentile
    const percentile = await scoringService.calculatePercentile(scores.total);

    // Update profile with new scores
    profile.scores = {
      ...scores,
      percentile,
      level: profile.calculateLevel()
    };

    // Add to score history
    profile.scoreHistory.push({
      date: new Date(),
      total: scores.total,
      breakdown: {
        personalPresence: scores.personalPresence,
        professionalProfiles: scores.professionalProfiles,
        networking: scores.networking,
        credentials: scores.credentials,
        thoughtLeadership: scores.thoughtLeadership
      }
    });

    // Keep only last 30 entries in history
    if (profile.scoreHistory.length > 30) {
      profile.scoreHistory = profile.scoreHistory.slice(-30);
    }

    // Generate suggestions
    const suggestions = suggestionService.generateSuggestions(profile, scores);
    profile.suggestions = suggestions;

    profile.lastCalculated = new Date();
    await profile.save();

    res.status(200).json({
      success: true,
      message: 'Profile score calculated successfully',
      scores: profile.scores,
      suggestions: profile.suggestions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update personal website info
// @route   PUT /api/profile-branding/personal-website
// @access  Private
exports.updatePersonalWebsite = async (req, res, next) => {
  try {
    const { url } = req.body;

    let profile = await ProfileBranding.findOne({ userId: req.user.id });
    if (!profile) {
      profile = await ProfileBranding.create({ userId: req.user.id });
    }

    // Verify website structure
    const verification = await websiteVerificationService.verifyWebsite(url);

    profile.personalWebsite = {
      url,
      hasAboutPage: verification.hasAboutPage,
      hasPortfolio: verification.hasPortfolio,
      hasBlog: verification.hasBlog,
      hasContactPage: verification.hasContactPage,
      blogPostCount: verification.blogPostCount,
      lastVerified: new Date(),
      lighthouseScore: verification.lighthouseScore || {}
    };

    await profile.save();

    // Recalculate score
    await exports.calculateScore(req, res, next);
  } catch (error) {
    next(error);
  }
};

// @desc    Update LinkedIn profile info
// @route   PUT /api/profile-branding/linkedin
// @access  Private
exports.updateLinkedIn = async (req, res, next) => {
  try {
    const {
      profileInfo = {},
      connectionsCount = 0,
      skills = [],
      experiences = [],
      education = [],
      certifications = [],
      networking = {}
    } = req.body;

    let profile = await ProfileBranding.findOne({ userId: req.user.id });
    if (!profile) {
      profile = await ProfileBranding.create({ userId: req.user.id });
    }

    // Merge LinkedIn data - prioritize manual input over auto-filled
    profile.linkedIn = {
      name: profileInfo.name || profile.linkedIn.name || null,
      profileUrl: profileInfo.profileUrl || profile.linkedIn.profileUrl || null,
      headline: profileInfo.headline || profile.linkedIn.headline || null,
      location: profileInfo.location || profile.linkedIn.location || null,
      about: profileInfo.about || profile.linkedIn.about || null,
      profilePictureUrl: profileInfo.profilePictureUrl || profile.linkedIn.profilePictureUrl || null,
      
      // Structured data with source tracking
      skills: Array.isArray(skills) ? skills : profile.linkedIn.skills || [],
      experiences: Array.isArray(experiences) ? experiences : profile.linkedIn.experiences || [],
      education: Array.isArray(education) ? education : profile.linkedIn.education || [],
      certifications: Array.isArray(certifications) ? certifications : profile.linkedIn.certifications || [],
      
      // Counts
      connectionsCount: getNumberOrFallback(connectionsCount, profile.linkedIn.connectionsCount),
      skillsCount: skills ? skills.length : profile.linkedIn.skillsCount,
      experienceCount: experiences ? experiences.length : profile.linkedIn.experienceCount,
      educationCount: education ? education.length : profile.linkedIn.educationCount,
      certificationsCount: certifications ? certifications.length : profile.linkedIn.certificationsCount,
      
      // Networking metrics
      endorsementsCount: getNumberOrFallback(networking.endorsements, profile.linkedIn.endorsementsCount),
      recommendationsCount: getNumberOrFallback(networking.recommendations, profile.linkedIn.recommendationsCount),
      
      lastUpdated: new Date()
    };

    // Recalculate scores
    const scores = scoringService.calculateProfileScore(profile);
    const percentile = await scoringService.calculatePercentile(scores.total);

    profile.scores = {
      ...scores,
      percentile,
      level: profile.calculateLevel()
    };

    // Add to score history
    profile.scoreHistory.push({
      date: new Date(),
      total: scores.total,
      breakdown: scores
    });

    // Keep only last 30 entries
    if (profile.scoreHistory.length > 30) {
      profile.scoreHistory = profile.scoreHistory.slice(-30);
    }

    // After user confirms/saves the LinkedIn data and we calculate scores,
    // remove any previously persisted scraped draft so it doesn't linger.
    try {
      if (profile.linkedIn && profile.linkedIn.scrapedDraft) {
        delete profile.linkedIn.scrapedDraft;
      }
      if (profile.linkedIn && profile.linkedIn.scrapedDraftAt) {
        delete profile.linkedIn.scrapedDraftAt;
      }
    } catch (e) {
      // continue even if deletion fails for some edge reason
      console.warn('Failed to remove scrapedDraft fields:', e && e.message ? e.message : e);
    }

    await profile.save();

    res.status(200).json({
      success: true,
      message: 'LinkedIn profile updated successfully',
      profile
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Scrape LinkedIn profile (enqueue job)
// @route   POST /api/profile-branding/linkedin/scrape
// @access  Private
exports.scrapeLinkedIn = async (req, res, next) => {
  try {
    const { profileUrl } = req.body;

    if (!profileUrl) {
      return res.status(400).json({ success: false, message: 'LinkedIn profile URL is required' });
    }

    if (!profileUrl.includes('linkedin.com/in/')) {
      return res.status(400).json({ success: false, message: 'Please provide a valid LinkedIn profile URL (linkedin.com/in/username)' });
    }

    // If server is running headless and we don't have an active LinkedIn session,
    // fail fast with an informative error instead of enqueueing a job that will timeout.
    const headful = process.env.LINKEDIN_SCRAPER_HEADFUL === 'true';
    const hasSession = (linkedinScraperService && typeof linkedinScraperService.hasSession === 'function')
      ? linkedinScraperService.hasSession()
      : false;

    if (!headful && !hasSession) {
      return res.status(400).json({
        success: false,
        message: 'Server running headless and no LinkedIn session available. Start the backend with LINKEDIN_SCRAPER_HEADFUL=true so you can manually login, or establish a session before enqueueing scrapes.'
      });
    }

    const jobId = linkedinScraperJobQueue.createJob(profileUrl, req.user.id);
    console.log(`Enqueued LinkedIn scrape job ${jobId} for user ${req.user.id}`);

    return res.status(202).json({ success: true, message: 'Scrape started', jobId });
  } catch (error) {
    next(error);
  }
};

// @desc    Get scrape job status/result
// @route   GET /api/profile-branding/linkedin/scrape/:jobId
// @access  Private
exports.getScrapeJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const job = linkedinScraperJobQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    return res.status(200).json({ success: true, job });
  } catch (error) {
    next(error);
  }
};

// @desc    Fetch and update GitHub profile
// @route   POST /api/profile-branding/github/fetch
// @access  Private
exports.fetchGithubProfile = async (req, res, next) => {
  try {
    const { username } = req.body;
    const normalizedUsername = normalizeGithubUsername(username);

    if (!normalizedUsername) {
      return res.status(400).json({
        success: false,
        message: 'GitHub username or profile URL is required'
      });
    }

    if (!isValidGithubUsername(normalizedUsername)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid GitHub username or profile URL'
      });
    }

    let profile = await ProfileBranding.findOne({ userId: req.user.id });
    if (!profile) {
      profile = await ProfileBranding.create({ userId: req.user.id });
    }

    // Fetch GitHub data
    const githubData = await githubService.fetchUserProfile(normalizedUsername);

    profile.github = {
      username: normalizedUsername,
      profileUrl: githubData.profileUrl,
      repositoriesCount: githubData.repositoriesCount,
      publicRepos: githubData.publicRepos,
      contributionsLastYear: githubData.contributionsLastYear,
      followers: githubData.followers,
      following: githubData.following,
      hasReadme: githubData.hasReadme,
      topLanguages: githubData.topLanguages,
      lastFetched: new Date()
    };

    await profile.save();

    res.status(200).json({
      success: true,
      message: 'GitHub profile fetched successfully',
      github: profile.github
    });
  } catch (error) {
    console.error('GitHub API Error:', error);

    const message = (error?.message || '').toLowerCase();

    if (error.status === 404 || message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: 'GitHub user not found. Please check the username and try again.'
      });
    }

    if (error.status === 429 || message.includes('rate limit')) {
      return res.status(429).json({
        success: false,
        message: 'GitHub API rate limit exceeded. Add a valid GITHUB_TOKEN to backend/.env for higher limits.'
      });
    }

    if (error.status === 503 || message.includes('token')) {
      return res.status(503).json({
        success: false,
        message: error.message
      });
    }

    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }

    next(error);
  }
};

// @desc    Analyze and update YouTube channel
// @route   POST /api/profile-branding/youtube/analyze
// @access  Private
exports.analyzeYouTubeChannel = async (req, res, next) => {
  try {
    const { channelUrl } = req.body;

    if (!channelUrl) {
      return res.status(400).json({
        success: false,
        message: 'YouTube channel URL is required'
      });
    }

    const selectedCourse = req.userDoc?.selectedCourse;
    if (!selectedCourse) {
      return res.status(400).json({
        success: false,
        message: 'Please select a course before analyzing YouTube content'
      });
    }

    let profile = await ProfileBranding.findOne({ userId: req.user.id });
    if (!profile) {
      profile = await ProfileBranding.create({ userId: req.user.id });
    }

    const youtubeData = await youtubeService.analyzeChannel(channelUrl, selectedCourse);

    profile.otherProfiles.youtube = youtubeData.channelUrl;
    profile.youtube = {
      ...youtubeData,
      score: youtubeData.metrics.overall,
      lastScraped: new Date()
    };

    await profile.save();

    res.status(200).json({
      success: true,
      message: 'YouTube channel analyzed successfully',
      youtube: profile.youtube
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add certification
// @route   POST /api/profile-branding/certifications
// @access  Private
exports.addCertification = async (req, res, next) => {
  try {
    const { title, issuer, issueDate, expiryDate, credentialId, credentialUrl } = req.body;

    let profile = await ProfileBranding.findOne({ userId: req.user.id });
    if (!profile) {
      profile = await ProfileBranding.create({ userId: req.user.id });
    }

    profile.certifications.push({
      title,
      issuer,
      issueDate,
      expiryDate,
      credentialId,
      credentialUrl,
      verified: false,
      addedAt: new Date()
    });

    await profile.save();

    res.status(201).json({
      success: true,
      message: 'Certification added successfully',
      certifications: profile.certifications
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add course
// @route   POST /api/profile-branding/courses
// @access  Private
exports.addCourse = async (req, res, next) => {
  try {
    const { title, platform, instructor, completionDate, certificateUrl, skills } = req.body;

    let profile = await ProfileBranding.findOne({ userId: req.user.id });
    if (!profile) {
      profile = await ProfileBranding.create({ userId: req.user.id });
    }

    profile.courses.push({
      title,
      platform,
      instructor,
      completionDate,
      certificateUrl,
      skills: skills || [],
      addedAt: new Date()
    });

    await profile.save();

    res.status(201).json({
      success: true,
      message: 'Course added successfully',
      courses: profile.courses
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add publication
// @route   POST /api/profile-branding/publications
// @access  Private
exports.addPublication = async (req, res, next) => {
  try {
    const { title, publicationType, url, publishDate, platform, description, views, likes } = req.body;

    let profile = await ProfileBranding.findOne({ userId: req.user.id });
    if (!profile) {
      profile = await ProfileBranding.create({ userId: req.user.id });
    }

    profile.publications.push({
      title,
      publicationType,
      url,
      publishDate,
      platform,
      description,
      views: views || 0,
      likes: likes || 0,
      addedAt: new Date()
    });

    await profile.save();

    res.status(201).json({
      success: true,
      message: 'Publication added successfully',
      publications: profile.publications
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update networking metrics
// @route   PUT /api/profile-branding/networking
// @access  Private
exports.updateNetworking = async (req, res, next) => {
  try {
    let profile = await ProfileBranding.findOne({ userId: req.user.id });
    if (!profile) {
      profile = await ProfileBranding.create({ userId: req.user.id });
    }

    const existingNetworking = profile.networking || {};

    const platform = (req.body.platform || existingNetworking?.platform || 'Twitter / X').trim();
    const profileUrl = (req.body.profileUrl || existingNetworking?.profileUrl || '').trim() || null;
    const followersCount = getNumberOrFallback(
      req.body.followersCount,
      getNetworkingFollowersCount(existingNetworking)
    );
    const groupsJoined = getNumberOrFallback(
      req.body.groupsJoined,
      getNumberOrFallback(existingNetworking?.groupsJoined, 0)
    );
    const postsLast60Days = getNumberOrFallback(
      req.body.postsLast60Days,
      getNetworkingPostsCount(existingNetworking)
    );
    const longFormArticles = getNumberOrFallback(
      req.body.longFormArticles,
      getNetworkingLongFormArticles(existingNetworking)
    );
    const engagementRate = getNumberOrFallback(
      req.body.engagementRate,
      getNumberOrFallback(existingNetworking?.engagementRate, 0)
    );

    profile.networking = {
      platform,
      profileUrl,
      followersCount,
      groupsJoined,
      postsLast60Days,
      longFormArticles,
      engagementRate,
      // Keep legacy fields synchronized while the rest of the app transitions.
      connectionsCount: followersCount,
      postsShared: postsLast60Days,
      articlesPublished: longFormArticles,
      score: profile.networking?.score || 0
    };

    await profile.save();

    res.status(200).json({
      success: true,
      message: 'Social media metrics updated successfully',
      networking: profile.networking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get score history
// @route   GET /api/profile-branding/score-history
// @access  Private
exports.getScoreHistory = async (req, res, next) => {
  try {
    const profile = await ProfileBranding.findOne({ userId: req.user.id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    res.status(200).json({
      success: true,
      scoreHistory: profile.scoreHistory
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark suggestion as completed
// @route   PUT /api/profile-branding/suggestions/:suggestionId/complete
// @access  Private
exports.completeSuggestion = async (req, res, next) => {
  try {
    const { suggestionId } = req.params;

    const profile = await ProfileBranding.findOne({ userId: req.user.id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    const suggestion = profile.suggestions.id(suggestionId);
    if (!suggestion) {
      return res.status(404).json({
        success: false,
        message: 'Suggestion not found'
      });
    }

    suggestion.completed = true;
    suggestion.completedAt = new Date();

    await profile.save();

    res.status(200).json({
      success: true,
      message: 'Suggestion marked as completed',
      suggestions: profile.suggestions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete certification
// @route   DELETE /api/profile-branding/certifications/:certId
// @access  Private
exports.deleteCertification = async (req, res, next) => {
  try {
    const { certId } = req.params;

    const profile = await ProfileBranding.findOne({ userId: req.user.id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    profile.certifications.id(certId).remove();
    await profile.save();

    res.status(200).json({
      success: true,
      message: 'Certification deleted successfully',
      certifications: profile.certifications
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete course
// @route   DELETE /api/profile-branding/courses/:courseId
// @access  Private
exports.deleteCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const profile = await ProfileBranding.findOne({ userId: req.user.id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    profile.courses.id(courseId).remove();
    await profile.save();

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully',
      courses: profile.courses
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete publication
// @route   DELETE /api/profile-branding/publications/:publicationId
// @access  Private
exports.deletePublication = async (req, res, next) => {
  try {
    const { publicationId } = req.params;

    const profile = await ProfileBranding.findOne({ userId: req.user.id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    profile.publications.id(publicationId).remove();
    await profile.save();

    res.status(200).json({
      success: true,
      message: 'Publication deleted successfully',
      publications: profile.publications
    });
  } catch (error) {
    next(error);
  }
};
