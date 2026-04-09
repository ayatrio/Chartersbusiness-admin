const express = require('express');
const router = express.Router();
const {
  improveHeadline,
  improveAboutSection,
  analyzeProfilePicture,
  extractCertificateText,
  parseResume,
  generatePersonalizedSuggestions,
  checkGrammar
} = require('../controllers/aiServicesController');
const { protect } = require('../../../shared/middleware/auth');
const upload = require('../../../shared/middleware/upload');

// All routes are protected
router.use(protect);

// Text improvement
router.post('/improve-headline', improveHeadline);
router.post('/improve-about', improveAboutSection);
router.post('/check-grammar', checkGrammar);
router.post('/generate-suggestions', generatePersonalizedSuggestions);

// File analysis (with multer)
router.post('/analyze-profile-picture', upload.single('profilePicture'), analyzeProfilePicture);
router.post('/extract-certificate-text', upload.single('certificate'), extractCertificateText);
router.post('/parse-resume', upload.single('resume'), parseResume);

module.exports = router;
