const express = require('express');

const { protect, requireAdmin } = require('../../../shared/middleware/auth');
const {
  getModuleHealth,
  getInterviewToken,
  scoreLanguageChunk,
} = require('../controllers/aiInterviewController');

const router = express.Router();

router.use(protect);

router.get('/health', requireAdmin, getModuleHealth);
router.get('/token', getInterviewToken);
router.post('/token', getInterviewToken);
router.post('/score-language', scoreLanguageChunk);

module.exports = router;
