const path = require('path');
// Load backend/.env specifically so APIFY_TOKEN is available
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const apifyScraper = require(path.join(__dirname, '..', 'services', 'apifyScraper'));

const profileUrl = process.argv[2] || 'https://www.linkedin.com/in/satyanadella';

(async () => {
  try {
    console.log('Testing Apify scraper for', profileUrl);
    const result = await apifyScraper.scrapeLinkedInProfile(profileUrl);

    if (!result) {
      console.error('No result returned from Apify');
      process.exit(2);
    }

    console.log('--- Scrape Summary ---');
    console.log('Profile URL:', result.profileUrl);
    console.log('Name:', result.profileInfo?.name || 'N/A');
    console.log('Headline:', result.profileInfo?.headline || 'N/A');
    console.log('Location:', result.profileInfo?.location || 'N/A');
    console.log('Connections:', result.connectionsCount || 0);
    console.log('Skills:', Array.isArray(result.skills) ? result.skills.length : 0);
    console.log('Experiences:', Array.isArray(result.experiences) ? result.experiences.length : 0);
    console.log('Education:', Array.isArray(result.education) ? result.education.length : 0);
    console.log('Certifications:', Array.isArray(result.certifications) ? result.certifications.length : 0);

    if (Array.isArray(result.skills) && result.skills.length) {
      console.log('Sample skills:', result.skills.slice(0, 8).map(s => (s.name || s)).join(', '));
    }

    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err && err.message ? err.message : err);
    if (err?.response?.data) {
      try { console.error('Apify error data:', JSON.stringify(err.response.data).slice(0, 2000)); } catch {};
    }
    process.exit(1);
  }
})();
