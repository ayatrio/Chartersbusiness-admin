const axios = require('axios');

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const ACTOR_ID = process.env.APIFY_ACTOR_ID || 'dev_fusion~linkedin-profile-scraper';
const APIFY_TIMEOUT = parseInt(process.env.APIFY_TIMEOUT_MS, 10) || 300000; // 5 minutes
const APIFY_MAX_RETRIES = parseInt(process.env.APIFY_MAX_RETRIES, 10) || 2;

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

const callApify = async (profileUrl) => {
  const syncUrl = `https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items?token=${APIFY_TOKEN}`;
  let lastErr = null;

  // First try the convenient synchronous endpoint. Try a couple of common input shapes.
  const candidateSyncInputs = [ { profileUrls: [profileUrl] }, { profiles: [profileUrl] } ];
  for (const inputBody of candidateSyncInputs) {
    for (let attempt = 1; attempt <= APIFY_MAX_RETRIES; attempt++) {
      try {
        const resp = await axios.post(syncUrl, inputBody, {
          headers: { 'Content-Type': 'application/json' },
          timeout: APIFY_TIMEOUT
        });
        return resp.data;
      } catch (err) {
        lastErr = err;
        const status = err?.response?.status;
        const transient = !status || (status >= 500 && status < 600);
        if (attempt < APIFY_MAX_RETRIES && transient) {
          const wait = 1500 * attempt;
          console.warn(`Apify sync call failed (attempt ${attempt}) — retrying in ${wait}ms`);
          await sleep(wait);
          continue;
        }

        // If it was a validation error, try the next candidate input shape.
        const bodyErr = err?.response?.data || '';
        if (typeof bodyErr === 'object' && bodyErr?.error && bodyErr.error.message && /profiles|profile/i.test(bodyErr.error.message)) {
          console.warn('Apify sync validation error suggests different input shape — trying next candidate');
          break; // break retry loop and try next candidate input
        }

        // Non-transient/unknown error — break out to runs fallback
        console.warn('Apify sync endpoint failed — will attempt runs endpoint fallback:', err && (err.response?.data || err.message) ? (err.response?.data || err.message) : err);
        attempt = APIFY_MAX_RETRIES; // stop retries for this input
        break;
      }
    }
  }

  // Fallback: start actor run via /runs and poll for completion, then fetch dataset items
  const runsUrl = `https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${APIFY_TOKEN}`;
  try {
    // Try a couple of common input shapes for the runs endpoint too
    const candidateRunInputs = [ { profileUrls: [profileUrl] }, { profiles: [profileUrl] } ];
    let runResp = null;
    let lastRunErr = null;
    for (const inputBody of candidateRunInputs) {
      try {
        runResp = await axios.post(runsUrl, inputBody, { headers: { 'Content-Type': 'application/json' }, timeout: APIFY_TIMEOUT });
        break;
      } catch (err) {
        lastRunErr = err;
        const bodyErr = err?.response?.data || '';
        if (typeof bodyErr === 'object' && bodyErr?.error && bodyErr.error.message && /profiles|profile/i.test(bodyErr.error.message)) {
          console.warn('Apify runs validation error suggests different input shape — trying next candidate');
          continue;
        }
        throw err;
      }
    }
    const run = runResp && runResp.data ? runResp.data : null;
    if (!run || !run.id) throw new Error('Failed to start Apify run');

    const runId = run.id;
    const pollUrl = `https://api.apify.com/v2/runs/${runId}?token=${APIFY_TOKEN}`;
    const start = Date.now();
    let runInfo = null;

    while (Date.now() - start < APIFY_TIMEOUT) {
      try {
        const r = await axios.get(pollUrl, { timeout: 15000 });
        runInfo = r.data;
        const status = (runInfo && runInfo.status) || '';
        if (status === 'SUCCEEDED') break;
        if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED_OUT') {
          throw new Error(`Apify run ${status}`);
        }
      } catch (pollErr) {
        console.warn('Polling run status error:', pollErr && (pollErr.response?.data || pollErr.message) ? (pollErr.response?.data || pollErr.message) : pollErr);
      }
      await sleep(3000);
    }

    if (!runInfo || runInfo.status !== 'SUCCEEDED') {
      throw new Error('Apify run did not complete successfully within timeout');
    }

    const datasetId = runInfo.defaultDatasetId;
    if (!datasetId) throw new Error('Apify run did not produce a dataset id');

    const dsUrl = `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}`;
    const itemsResp = await axios.get(dsUrl, { timeout: APIFY_TIMEOUT });
    return itemsResp.data;
  } catch (err) {
    if (lastErr) throw lastErr;
    throw err;
  }
};

const callApifyWithClient = async (profileUrl) => {
  // Dynamically require apify-client to avoid hard dependency if not installed
  let ApifyClientCtor = null;
  try {
    const mod = require('apify-client');
    ApifyClientCtor = mod.ApifyClient || mod.default || mod;
  } catch (e) {
    throw new Error('apify-client module not installed');
  }

  const client = new ApifyClientCtor({ token: APIFY_TOKEN });

  const candidateInputs = [ { profileUrls: [profileUrl] }, { profiles: [profileUrl] } ];
  let run = null;
  for (const input of candidateInputs) {
    try {
      run = await client.actor(ACTOR_ID).call(input);
      if (run && (run.defaultDatasetId || run.defaultDataset)) break;
    } catch (e) {
      const bodyErr = e?.response?.data || e?.message || '';
      if (typeof bodyErr === 'object' && bodyErr?.error && bodyErr.error.message && /profiles|profile/i.test(bodyErr.error.message)) {
        console.warn('Apify client validation error suggests different input shape — trying next candidate');
        continue;
      }
      throw e;
    }
  }

  const datasetId = run && (run.defaultDatasetId || run.defaultDataset);
  if (!datasetId) {
    throw new Error('Apify run did not return a default dataset id');
  }

  const { items } = await client.dataset(datasetId).listItems();
  return items;
};

const normalizeItem = (item = {}, profileUrl) => {
  // Best-effort mapping of common actor output shapes to app schema
  const pick = (keys) => {
    for (const k of keys) {
      if (item[k] !== undefined && item[k] !== null) return item[k];
    }
    return null;
  };

  const profileInfo = {
    name: pick(['profileInfo', 'name', 'fullName', 'full_name', 'profile_name'])?.name || pick(['name', 'fullName', 'full_name']) || null,
    headline: pick(['headline', 'profileInfo', 'summary'])?.headline || pick(['headline', 'summary', 'about']) || null,
    location: pick(['location', 'locationName', 'profileInfo'])?.location || pick(['location']) || null,
    about: pick(['about', 'summary', 'description']) || null,
    profilePictureUrl: pick(['profilePictureUrl', 'image', 'photo', 'avatar', 'profileImage']) || null
  };

  const toSkill = (s) => {
    if (!s) return null;
    if (typeof s === 'string') return { name: s, source: 'auto' };
    if (s.name) return { name: s.name, source: s.source || 'auto' };
    return null;
  };

  const skillsRaw = pick(['skills', 'topSkills', 'skillSet']) || [];
  const skills = Array.isArray(skillsRaw) ? skillsRaw.map(toSkill).filter(Boolean) : [];

  const mapExperience = (e) => {
    if (!e) return null;
    return {
      title: e.title || e.jobTitle || e.position || null,
      company: e.company || e.employer || e.organization || null,
      dateRange: e.dateRange || e.duration || e.period || null,
      source: 'auto'
    };
  };

  const experiencesRaw = pick(['experiences', 'work', 'positions']) || [];
  const experiences = Array.isArray(experiencesRaw) ? experiencesRaw.map(mapExperience).filter(Boolean) : [];

  const educationRaw = pick(['education', 'schools']) || [];
  const education = Array.isArray(educationRaw) ? educationRaw.map((e) => ({ school: e.school || e.institution || e.name || null, degree: e.degree || e.field || null, source: 'auto' })).filter(Boolean) : [];

  const certsRaw = pick(['certifications', 'certs', 'certificates']) || [];
  const certifications = Array.isArray(certsRaw) ? certsRaw.map((c) => ({ title: c.title || c.name || null, issuer: c.issuer || c.issuerName || null, source: 'auto' })).filter(Boolean) : [];

  const connectionsCount = Number(pick(['connectionsCount', 'connections', 'followers'])) || 0;

  return {
    profileUrl: profileUrl || pick(['profileUrl', 'url']) || null,
    profileInfo,
    connectionsCount,
    skills,
    experiences,
    education,
    certifications
  };
};

exports.scrapeLinkedInProfile = async (profileUrl) => {
  try {
    if (!profileUrl || !profileUrl.includes('linkedin.com/in/')) {
      throw new Error('Invalid LinkedIn URL');
    }

    if (!APIFY_TOKEN) {
      throw new Error('APIFY_TOKEN environment variable is required for Apify calls');
    }

    console.log('🚀 Calling Apify actor', ACTOR_ID, 'for', profileUrl);
    // Try Apify client first (if available & enabled), otherwise fall back to HTTP endpoint
    const useClient = process.env.APIFY_USE_CLIENT !== 'false';
    if (useClient) {
      try {
        const items = await callApifyWithClient(profileUrl);
        if (!items || !Array.isArray(items) || items.length === 0) {
          throw new Error('Apify client returned no dataset items');
        }
        if (items[0] && items[0].error) throw new Error(items[0].error);
        console.log('✅ Apify client response received — mapping output');
        return normalizeItem(items[0], profileUrl);
      } catch (clientErr) {
        console.warn('Apify client call failed, falling back to HTTP endpoint:', clientErr && clientErr.message ? clientErr.message : clientErr);
      }
    }

    const data = await callApify(profileUrl);

    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error('Apify returned no dataset items for the provided profile');
    }

    if (data[0] && data[0].error) throw new Error(data[0].error);

    console.log('✅ Apify HTTP response received — mapping output');

    return normalizeItem(data[0], profileUrl);
  } catch (err) {
    console.error('❌ Apify scraping failed:', err && err.message ? err.message : err);
    throw err;
  }
};
