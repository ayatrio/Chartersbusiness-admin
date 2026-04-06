const axios = require('axios');
const cheerio = require('cheerio');

const COURSE_KEYWORDS = {
  'Certified Management Professional (CMP)': [
    'management',
    'manager',
    'leadership',
    'business',
    'strategy',
    'operations',
    'project management',
    'team',
    'stakeholder',
    'planning',
    'execution',
    'decision making',
    'process improvement',
    'professional'
  ],
  'Digital Growth Engineer': [
    'digital',
    'growth',
    'marketing',
    'seo',
    'sem',
    'analytics',
    'conversion',
    'funnel',
    'acquisition',
    'retention',
    'campaign',
    'performance marketing',
    'automation',
    'growth hacking'
  ],
  'Product Growth Engineering': [
    'product',
    'growth',
    'engineering',
    'onboarding',
    'activation',
    'retention',
    'experiment',
    'a/b test',
    'feature',
    'roadmap',
    'engagement',
    'product analytics',
    'monetization',
    'user research'
  ]
};

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'into', 'your', 'this', 'that',
  'are', 'how', 'what', 'why', 'you', 'our', 'their', 'its', 'certified',
  'professional'
]);

const YOUTUBE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9'
};

const normalizeText = (value = '') => value
  .toLowerCase()
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9\s]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const tokenize = (value = '') => normalizeText(value)
  .split(' ')
  .filter((token) => token && token.length > 2 && !STOP_WORDS.has(token));

const getText = (textObject) => {
  if (!textObject) return '';
  if (typeof textObject === 'string') return textObject;
  if (typeof textObject.simpleText === 'string') return textObject.simpleText;
  if (Array.isArray(textObject.runs)) {
    return textObject.runs.map((run) => run.text || '').join('');
  }
  return '';
};

const parseDurationToSeconds = (lengthText = '') => {
  const parts = lengthText.split(':').map((part) => parseInt(part, 10));

  if (!lengthText || parts.some(Number.isNaN)) {
    return 0;
  }

  return parts.reduce((total, part) => total * 60 + part, 0);
};

const courseTokens = (course) => tokenize(course.replace(/\([^)]*\)/g, ' '));

const scoreTitleRelevance = (title, selectedCourse) => {
  const normalizedTitle = normalizeText(title);
  const matchedKeywords = [];
  let score = 0;

  const normalizedCourse = normalizeText(selectedCourse.replace(/\([^)]*\)/g, ' '));
  if (normalizedCourse && normalizedTitle.includes(normalizedCourse)) {
    score += 40;
    matchedKeywords.push(selectedCourse);
  }

  if (selectedCourse.includes('(CMP)') && normalizedTitle.includes('cmp')) {
    score += 20;
    matchedKeywords.push('cmp');
  }

  for (const keyword of COURSE_KEYWORDS[selectedCourse] || []) {
    if (normalizedTitle.includes(normalizeText(keyword))) {
      score += 15;
      matchedKeywords.push(keyword);
    }
  }

  for (const token of courseTokens(selectedCourse)) {
    if (normalizedTitle.includes(token) && !matchedKeywords.includes(token)) {
      score += 6;
      matchedKeywords.push(token);
    }
  }

  const relevanceScore = Math.min(100, score);

  return {
    score: relevanceScore,
    label: relevanceScore >= 70 ? 'high' : relevanceScore >= 45 ? 'medium' : 'low',
    matchedKeywords: matchedKeywords.slice(0, 5)
  };
};

const extractJsonObject = (html, marker) => {
  const markerIndex = html.indexOf(marker);
  if (markerIndex === -1) return null;

  const start = html.indexOf('{', markerIndex + marker.length);
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaping = false;

  for (let i = start; i < html.length; i += 1) {
    const char = html[i];

    if (escaping) {
      escaping = false;
      continue;
    }

    if (char === '\\') {
      escaping = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === '{') depth += 1;
      if (char === '}') depth -= 1;

      if (depth === 0) {
        return html.slice(start, i + 1);
      }
    }
  }

  return null;
};

const extractInitialData = (html) => {
  const markers = [
    'var ytInitialData = ',
    'window["ytInitialData"] = ',
    'ytInitialData = '
  ];

  for (const marker of markers) {
    const jsonString = extractJsonObject(html, marker);
    if (jsonString) {
      return JSON.parse(jsonString);
    }
  }

  throw new Error('Could not parse the YouTube channel page.');
};

const collectVideoRenderers = (node, renderers = [], seen = new Set()) => {
  if (!node || typeof node !== 'object') {
    return renderers;
  }

  if (Array.isArray(node)) {
    node.forEach((value) => collectVideoRenderers(value, renderers, seen));
    return renderers;
  }

  const candidates = [
    node.gridVideoRenderer,
    node.videoRenderer,
    node.richItemRenderer?.content?.videoRenderer
  ].filter(Boolean);

  for (const renderer of candidates) {
    if (renderer.videoId && !seen.has(renderer.videoId)) {
      seen.add(renderer.videoId);
      renderers.push(renderer);
    }
  }

  Object.values(node).forEach((value) => collectVideoRenderers(value, renderers, seen));
  return renderers;
};

const normalizeChannelUrl = (channelUrl) => {
  let value = (channelUrl || '').trim();

  if (!value) {
    throw new Error('A YouTube channel link is required.');
  }

  if (value.startsWith('@')) {
    return `https://www.youtube.com/${value}/videos`;
  }

  if (!/^https?:\/\//i.test(value)) {
    value = `https://${value}`;
  }

  const parsed = new URL(value);
  const hostname = parsed.hostname.replace(/^www\./, '').replace(/^m\./, '');

  if (hostname !== 'youtube.com') {
    throw new Error('Please enter a public YouTube channel URL.');
  }

  let pathname = parsed.pathname.replace(/\/+$/, '');
  if (!pathname || pathname === '/') {
    throw new Error('Please enter a valid YouTube channel URL.');
  }

  pathname = pathname.replace(/\/(videos|featured|shorts|streams|playlists)$/i, '');

  return `https://www.youtube.com${pathname}/videos`;
};

const buildVideoFromRenderer = (renderer, selectedCourse) => {
  const title = getText(renderer.title);
  const lengthText =
    getText(renderer.lengthText) ||
    getText(
      renderer.thumbnailOverlays?.find(
        (overlay) => overlay.thumbnailOverlayTimeStatusRenderer
      )?.thumbnailOverlayTimeStatusRenderer?.text
    );
  const relevance = scoreTitleRelevance(title, selectedCourse);

  return {
    title,
    url: renderer.videoId ? `https://www.youtube.com/watch?v=${renderer.videoId}` : null,
    lengthText: lengthText || 'N/A',
    lengthSeconds: parseDurationToSeconds(lengthText),
    relevanceScore: relevance.score,
    relevanceLabel: relevance.label,
    matchedKeywords: relevance.matchedKeywords
  };
};

const computeMetrics = (videos) => {
  const totalVideos = videos.length;
  const videosWithLength = videos.filter((video) => video.lengthSeconds > 0);
  const averageLengthSeconds = videosWithLength.length
    ? Math.round(
        videosWithLength.reduce((sum, video) => sum + video.lengthSeconds, 0) /
          videosWithLength.length
      )
    : 0;
  const averageRelevanceScore = totalVideos
    ? Math.round(
        videos.reduce((sum, video) => sum + video.relevanceScore, 0) / totalVideos
      )
    : 0;
  const relevantVideoCount = videos.filter((video) => video.relevanceScore >= 45).length;

  let titleRelevance = 0;
  if (averageRelevanceScore >= 45) titleRelevance += 2;
  if (averageRelevanceScore >= 70) titleRelevance += 3;

  const videoLength =
    averageLengthSeconds >= 180 && averageLengthSeconds <= 2400 ? 3 : 0;

  let videoCount = 0;
  if (totalVideos >= 8) videoCount += 1;
  if (totalVideos >= 18) videoCount += 1;

  const overall = titleRelevance + videoLength + videoCount;
  const thoughtLeadershipBonus =
    overall >= 8 ? 3 : overall >= 5 ? 2 : overall >= 2 ? 1 : 0;

  return {
    totalVideos,
    relevantVideoCount,
    averageLengthSeconds,
    averageRelevanceScore,
    metrics: {
      titleRelevance,
      videoLength,
      videoCount,
      overall,
      thoughtLeadershipBonus
    }
  };
};

exports.analyzeChannel = async (channelUrl, selectedCourse) => {
  const videosPageUrl = normalizeChannelUrl(channelUrl);
  const { data: html } = await axios.get(videosPageUrl, {
    headers: YOUTUBE_HEADERS,
    timeout: 15000
  });

  const $ = cheerio.load(html);
  const initialData = extractInitialData(html);
  const renderers = collectVideoRenderers(initialData);
  const allVideos = renderers
    .map((renderer) => buildVideoFromRenderer(renderer, selectedCourse))
    .filter((video) => video.title);
  const videos = allVideos.slice(0, 12);

  if (allVideos.length === 0) {
    throw new Error('No videos were found on that channel page.');
  }

  return {
    channelUrl: channelUrl.trim(),
    videosPageUrl,
    channelName:
      initialData.metadata?.channelMetadataRenderer?.title ||
      $('meta[property="og:title"]').attr('content')?.replace(/\s+-\s+YouTube$/i, '') ||
      'YouTube Channel',
    selectedCourse,
    ...computeMetrics(allVideos),
    videos
  };
};
