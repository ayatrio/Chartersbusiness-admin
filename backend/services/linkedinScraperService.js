// Replaced heavy Puppeteer-based scraper with Apify-backed scraper.
// The original Puppeteer implementation was fragile and is intentionally removed.
const apifyScraper = require('./apifyScraper');

exports.scrapeLinkedInProfile = apifyScraper.scrapeLinkedInProfile;

// Apify handles logins/anti-bot; report session available
exports.hasSession = () => true;

// No local browser to clean up for Apify-based scraper
exports.cleanup = async () => {};
