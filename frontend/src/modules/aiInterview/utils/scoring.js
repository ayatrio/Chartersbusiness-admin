import { aiInterviewService } from '../../../services/api';

const FILLER_PATTERN = /\b(um+|uh+|like|you know|basically|literally|sort of|kind of|i mean|actually|honestly)\b/gi;

const clampScore = (value, fallback = 50) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(0, Math.min(100, Math.round(parsed)));
};

const normalizeText = (value) => String(value || '')
  .replace(/\s+/g, ' ')
  .trim();

export const getPerformanceBand = (score) => {
  if (score >= 85) return 'Expert';
  if (score >= 70) return 'Strong';
  if (score >= 55) return 'Growing';
  return 'Beginner';
};

export function localLanguageScore(text) {
  const normalized = normalizeText(text);
  if (normalized.length < 10) {
    return {
      grammar: 50,
      vocabulary: 50,
      clarity: 50,
      fillers: 0,
      overall: 50,
      feedback: 'Answer is too short to evaluate.',
    };
  }

  const words = normalized.split(' ').filter(Boolean);
  const wordCount = words.length;
  const fillers = (normalized.match(FILLER_PATTERN) || []).length;
  const uniqueRatio = wordCount
    ? new Set(words.map((word) => word.toLowerCase())).size / wordCount
    : 0;
  const sentenceCount = Math.max(1, (normalized.match(/[.!?]/g) || []).length);
  const avgSentenceLength = wordCount / sentenceCount;
  const avgWordLength = wordCount
    ? words.reduce((sum, word) => sum + word.length, 0) / wordCount
    : 0;

  const grammar = clampScore(78 - Math.abs(avgSentenceLength - 14) * 1.8 - fillers * 2, 62);
  const vocabulary = clampScore(uniqueRatio * 95 + avgWordLength * 2.5, 62);
  const clarity = clampScore(84 - Math.max(0, avgSentenceLength - 24) * 1.9 - fillers * 3, 62);
  const overall = clampScore(
    grammar * 0.35 + vocabulary * 0.35 + clarity * 0.30 - fillers * 3,
    62
  );

  const feedback = fillers >= 4
    ? 'Reduce filler words and add short pauses before key points.'
    : clarity < 60
      ? 'Structure your response with a clear beginning, action, and result.'
      : 'Clear response. Add one concrete example for stronger impact.';

  return {
    grammar,
    vocabulary,
    clarity,
    fillers,
    overall,
    feedback,
  };
}

const normalizeLanguageScore = (payload, text) => {
  const fallback = localLanguageScore(text);
  const fillers = Number.isFinite(Number(payload?.fillers))
    ? Math.max(0, Math.round(Number(payload.fillers)))
    : fallback.fillers;
  const grammar = clampScore(payload?.grammar, fallback.grammar);
  const vocabulary = clampScore(payload?.vocabulary, fallback.vocabulary);
  const clarity = clampScore(payload?.clarity, fallback.clarity);
  const computedOverall = clampScore(
    grammar * 0.35 + vocabulary * 0.35 + clarity * 0.30 - fillers * 3,
    fallback.overall
  );

  return {
    grammar,
    vocabulary,
    clarity,
    fillers,
    overall: clampScore(payload?.overall, computedOverall),
    feedback: normalizeText(payload?.feedback) || fallback.feedback,
    source: payload?.source || 'fallback',
  };
};

export async function analyzeLanguageChunk(text) {
  const normalized = normalizeText(text);
  if (normalized.length < 10) {
    return localLanguageScore(normalized);
  }

  try {
    const { data } = await aiInterviewService.scoreLanguage(normalized);
    const payload = data?.score && typeof data.score === 'object' ? data.score : data;
    return normalizeLanguageScore(payload, normalized);
  } catch (error) {
    return {
      ...localLanguageScore(normalized),
      source: 'fallback',
    };
  }
}

export function scoreBodyLanguage(snapshots) {
  if (!Array.isArray(snapshots) || !snapshots.length) {
    return 50;
  }

  const average = (key) => (
    snapshots.reduce((sum, snapshot) => sum + Number(snapshot?.[key] || 0), 0) / snapshots.length
  );

  const confidence = average('confidence');
  const nervousness = average('nervousness');
  const engagement = average('engagement');
  const eyeContact = average('eyeContact');

  const rawScore = (
    confidence * 40 +
    engagement * 30 +
    eyeContact * 20 -
    nervousness * 25
  ) * 100;

  return clampScore(rawScore, 50);
}

export function calculateFinalScore({
  languageSnapshots = [],
  bodySnapshots = [],
  voiceScore = 70,
  technicalScore = 70,
}) {
  const language = Array.isArray(languageSnapshots) && languageSnapshots.length
    ? clampScore(
      languageSnapshots.reduce((sum, entry) => sum + Number(entry?.overall || 0), 0) / languageSnapshots.length,
      50
    )
    : 50;

  const body = scoreBodyLanguage(bodySnapshots);
  const voice = clampScore(voiceScore, 70);
  const technical = clampScore(technicalScore, 70);

  const overall = clampScore(
    language * 0.35 +
    body * 0.30 +
    voice * 0.20 +
    technical * 0.15,
    50
  );

  return {
    language,
    body,
    voice,
    technical,
    overall,
  };
}
