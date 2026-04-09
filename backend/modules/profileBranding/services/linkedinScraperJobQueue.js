const crypto = require('crypto');
const linkedinScraperService = require('./linkedinScraperService');
const ProfileBranding = require('../models/ProfileBranding');
const scoringService = require('./scoringService');
const suggestionService = require('./suggestionService');

const jobs = new Map();

const createJob = (profileUrl, userId) => {
  const id = (crypto && crypto.randomUUID) ? crypto.randomUUID() : require('uuid').v4();
  const job = {
    id,
    profileUrl,
    userId,
    status: 'queued',
    createdAt: new Date().toISOString(),
    progress: 0
  };
  jobs.set(id, job);
  // start processing asynchronously
  process.nextTick(() => runJob(id).catch(err => console.error('Job runner error:', err)));
  return id;
};

const getJob = (id) => jobs.get(id) || null;

const runJob = async (id) => {
  const job = jobs.get(id);
  if (!job) return;
  job.status = 'processing';
  job.startedAt = new Date().toISOString();

  try {
    console.log(`🔔 Processing LinkedIn scrape job ${id} for user ${job.userId}`);

    const scraped = await linkedinScraperService.scrapeLinkedInProfile(job.profileUrl);

    // Update or create profile document for the user, but do not overwrite
    // the user's saved LinkedIn fields or recalculate scores here. Instead,
    // persist the scraped results as a draft on the profile so the frontend
    // can surface them and the user may confirm/update before final save.
    let profile = await ProfileBranding.findOne({ userId: job.userId });
    if (!profile) profile = await ProfileBranding.create({ userId: job.userId });

    profile.linkedIn = profile.linkedIn || {};
    profile.linkedIn.scrapedDraft = {
      profileUrl: scraped.profileUrl || profile.linkedIn.profileUrl || null,
      profileInfo: scraped.profileInfo || {},
      skills: scraped.skills || [],
      experiences: scraped.experiences || [],
      education: scraped.education || [],
      certifications: scraped.certifications || [],
      connectionsCount: scraped.connectionsCount || 0
    };
    profile.linkedIn.scrapedDraftAt = new Date();

    await profile.save();

    job.status = 'completed';
    job.finishedAt = new Date().toISOString();
    job.result = {
      scraped,
      linkedInDraft: profile.linkedIn.scrapedDraft
    };

    console.log(`✅ Completed LinkedIn scrape job ${id} (draft saved)`);
  } catch (err) {
    console.error(`❌ LinkedIn scrape job ${id} failed:`, err && err.message ? err.message : err);
    job.status = 'failed';
    job.finishedAt = new Date().toISOString();
    job.error = err && (err.message || String(err));
  }
};

module.exports = {
  createJob,
  getJob
};

// Graceful shutdown: mark queued/processing jobs failed and clear jobs map
module.exports.shutdown = async () => {
  try {
    console.log('🔌 Shutting down LinkedIn job queue — marking active jobs failed');
    for (const [id, job] of jobs.entries()) {
      if (job.status === 'queued' || job.status === 'processing') {
        job.status = 'failed';
        job.finishedAt = new Date().toISOString();
        job.error = 'Server shutting down';
        console.log(`Marked job ${id} as failed`);
      }
    }
    // optional: clear jobs map so no stale references remain
    jobs.clear();
  } catch (e) {
    console.error('❌ Error shutting down job queue:', e && e.message ? e.message : e);
  }
};
