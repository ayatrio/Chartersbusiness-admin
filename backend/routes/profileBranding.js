const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

let controller;

try {
  controller = require('../controllers/profileBrandingController');
  console.log('profileBrandingController loaded');
} catch (error) {
  console.error('profileBrandingController load error:', error.message);

  router.use((req, res) => {
    res.status(503).json({
      success: false,
      message: `Service loading error: ${error.message}`
    });
  });

  module.exports = router;
  return;
}

router.use(protect);

router.get('/score', controller.getProfileScore);
router.post('/calculate', controller.calculateScore);
router.get('/score-history', controller.getScoreHistory);

router.put('/personal-website', controller.updatePersonalWebsite);
router.post('/linkedin/scrape', controller.scrapeLinkedIn);
router.get('/linkedin/scrape/:jobId', controller.getScrapeJob);
router.put('/linkedin', controller.updateLinkedIn);
router.post('/github/fetch', controller.fetchGithubProfile);
router.post('/youtube/analyze', controller.analyzeYouTubeChannel);
router.put('/networking', controller.updateNetworking);

router.post('/certifications', controller.addCertification);
router.delete('/certifications/:certId', controller.deleteCertification);

router.post('/courses', controller.addCourse);
router.delete('/courses/:courseId', controller.deleteCourse);

router.post('/publications', controller.addPublication);
router.delete('/publications/:publicationId', controller.deletePublication);

router.put('/suggestions/:suggestionId/complete', controller.completeSuggestion);

module.exports = router;
