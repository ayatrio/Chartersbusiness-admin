const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const axios = require('axios');

const ACTOR_ID = process.env.APIFY_ACTOR_ID || 'dev_fusion~linkedin-profile-scraper';
const APIFY_TOKEN = process.env.APIFY_TOKEN;
const profileUrl = process.argv[2] || 'https://www.linkedin.com/in/satyanadella';

if (!APIFY_TOKEN) {
  console.error('APIFY_TOKEN not set in backend/.env');
  process.exit(2);
}

const url = `https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items?token=${APIFY_TOKEN}`;

(async () => {
  try {
    console.log('Calling Apify directly for', profileUrl);
    const resp = await axios.post(url, { profileUrls: [profileUrl] }, { headers: { 'Content-Type': 'application/json' }, timeout: 300000 });
    const data = resp.data;
    console.log('Returned items:', Array.isArray(data) ? data.length : 'N/A');
    if (Array.isArray(data) && data.length) {
      const item = data[0];
      console.log('--- Raw item keys ---');
      console.log(Object.keys(item).join(', '));
      console.log('--- Raw item JSON (trimmed to 5000 chars) ---');
      console.log(JSON.stringify(item, null, 2).slice(0, 5000));
    } else {
      console.log('No dataset items returned');
    }
  } catch (err) {
    console.error('Error calling Apify:', err && err.message ? err.message : err);
    if (err?.response?.data) {
      try { console.error('Apify response data:', JSON.stringify(err.response.data).slice(0, 2000)); } catch {};
    }
    process.exit(1);
  }
})();
