import { aiInterviewService } from '../../../services/api';

const FILLER_PATTERN = /\b(um+|uh+|like|you know|basically|literally|sort of|kind of|i mean|actually|honestly)\b/gi;
const METRIC_PATTERN = /\b(\d+(?:\.\d+)?%|\d+(?:\.\d+)?x|\$\d+(?:,\d{3})*|\d+\s*(?:users?|clients?|months?|weeks?|days?|projects?|tickets?|bugs?|releases?))\b/gi;
const RESULT_PATTERN = /\b(increased|reduced|improved|optimized|delivered|launched|saved|achieved|grew|decreased|boosted)\b/gi;
const STAR_SIGNALS = {
  situation: /\b(situation|context|challenge|problem|background)\b/i,
  task: /\b(task|goal|objective|responsible|needed to)\b/i,
  action: /\b(i built|i implemented|i created|i designed|i led|i collaborated|i analyzed|i fixed|i developed)\b/i,
  result: /\b(result|outcome|impact|improved|increased|reduced|achieved|delivered)\b/i,
};
const KEYWORD_STOPWORDS = new Set([
  'the', 'and', 'for', 'that', 'this', 'with', 'from', 'have', 'about', 'into', 'your',
  'what', 'when', 'where', 'which', 'would', 'could', 'should', 'their', 'them', 'they',
  'were', 'been', 'being', 'also', 'just', 'than', 'then', 'very', 'more', 'most', 'some',
  'many', 'much', 'only', 'over', 'under', 'after', 'before', 'during', 'because', 'while',
]);
const RUBRIC_WEIGHTS = Object.freeze({
  content: 50,
  body: 25,
  voice: 15,
  normalizationBase: 90,
});

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

const average = (items) => {
  if (!Array.isArray(items) || !items.length) {
    return 0;
  }

  return items.reduce((sum, value) => sum + Number(value || 0), 0) / items.length;
};

const countWords = (text) => normalizeText(text).split(' ').filter(Boolean).length;
const countSentences = (text) => Math.max(1, (normalizeText(text).match(/[.!?]/g) || []).length);

const tokenizeKeywords = (text) => normalizeText(text)
  .toLowerCase()
  .replace(/[^a-z0-9\s]/g, ' ')
  .split(/\s+/)
  .filter((token) => token.length > 2 && !KEYWORD_STOPWORDS.has(token));

const getUserAnswers = (transcript = []) => transcript
  .filter((entry) => entry?.speaker === 'user')
  .map((entry) => normalizeText(entry?.text))
  .filter(Boolean);

const getQuestionAnswerPairs = (transcript = []) => {
  const pairs = [];
  let latestQuestion = '';

  transcript.forEach((entry) => {
    const text = normalizeText(entry?.text);
    if (!text) {
      return;
    }

    if (entry?.speaker === 'ai') {
      latestQuestion = text;
      return;
    }

    if (entry?.speaker === 'user') {
      pairs.push({ question: latestQuestion, answer: text });
    }
  });

  return pairs;
};

const scoreAnswerRelevance = (question, answer) => {
  const answerWords = countWords(answer);
  const questionTokens = tokenizeKeywords(question);
  const answerTokens = new Set(tokenizeKeywords(answer));

  if (!questionTokens.length) {
    return clampScore(45 + Math.min(answerWords, 70) * 0.6, 50);
  }

  const overlapCount = questionTokens.filter((token) => answerTokens.has(token)).length;
  const overlapRatio = overlapCount / questionTokens.length;
  const depthSignal = Math.min(answerWords / 45, 1);
  const relevance = overlapRatio * 0.75 + depthSignal * 0.25;

  return clampScore(relevance * 100, 50);
};

const scoreAnswerCompleteness = (answer) => {
  const words = countWords(answer);
  const sentences = countSentences(answer);
  const hasFlowMarkers = /\b(first|then|next|finally|because|therefore|so that)\b/i.test(answer);

  let lengthScore = 0;
  if (words < 10) {
    lengthScore = 35;
  } else if (words < 20) {
    lengthScore = 55;
  } else if (words <= 90) {
    lengthScore = 75 + Math.min((words - 20) * 0.2, 15);
  } else {
    lengthScore = 88 - Math.min((words - 90) * 0.2, 25);
  }

  const sentenceScore = sentences >= 3 ? 90 : sentences === 2 ? 78 : 62;
  const flowBonus = hasFlowMarkers ? 6 : 0;
  return clampScore(lengthScore * 0.7 + sentenceScore * 0.3 + flowBonus, 50);
};

const scoreAnswerStructure = (answer) => {
  const starHits = Object.values(STAR_SIGNALS).reduce(
    (count, pattern) => count + (pattern.test(answer) ? 1 : 0),
    0
  );
  const starCoverage = starHits / 4;
  const hasChronology = /\b(first|then|after|finally|eventually)\b/i.test(answer);
  const sentenceCount = countSentences(answer);

  return clampScore(
    40 + starCoverage * 45 + (hasChronology ? 10 : 0) + (sentenceCount >= 3 ? 5 : 0),
    50
  );
};

const scoreAnswerEvidence = (answer) => {
  const metricHits = (answer.match(METRIC_PATTERN) || []).length;
  const resultHits = (answer.match(RESULT_PATTERN) || []).length;
  const hasSpecificityCue = /\b(for example|for instance|specifically|in my last role)\b/i.test(answer);

  return clampScore(
    38 + Math.min(metricHits, 4) * 11 + Math.min(resultHits, 4) * 6 + (hasSpecificityCue ? 8 : 0),
    50
  );
};

const scoreContentAnswers = ({ transcript = [], languageSnapshots = [] }) => {
  const pairs = getQuestionAnswerPairs(transcript);
  const answers = getUserAnswers(transcript);

  if (!answers.length) {
    return {
      overall: 50,
      dimensions: {
        relevance: 50,
        completeness: 50,
        accuracy: 50,
        structure: 50,
        evidence: 50,
      },
    };
  }

  const relevance = clampScore(
    average(
      pairs.map((pair) => scoreAnswerRelevance(pair.question, pair.answer))
    ),
    50
  );
  const completeness = clampScore(average(answers.map(scoreAnswerCompleteness)), 50);
  const structure = clampScore(average(answers.map(scoreAnswerStructure)), 50);
  const evidence = clampScore(average(answers.map(scoreAnswerEvidence)), 50);

  const accuracyProxy = Array.isArray(languageSnapshots) && languageSnapshots.length
    ? clampScore(
      average(
        languageSnapshots.map((entry) => (
          Number(entry?.grammar || 0) * 0.45
          + Number(entry?.clarity || 0) * 0.35
          + Number(entry?.vocabulary || 0) * 0.20
        ))
      ),
      50
    )
    : clampScore((structure * 0.55) + (evidence * 0.45), 50);

  const overall = clampScore(
    relevance * 0.25
    + completeness * 0.20
    + accuracyProxy * 0.20
    + structure * 0.20
    + evidence * 0.15,
    50
  );

  return {
    overall,
    dimensions: {
      relevance,
      completeness,
      accuracy: accuracyProxy,
      structure,
      evidence,
    },
  };
};

const scoreBodyLanguageDetailed = (snapshots = []) => {
  if (!Array.isArray(snapshots) || !snapshots.length) {
    return {
      overall: 50,
      dimensions: {
        eyeContact: 50,
        posture: 50,
        gestures: 50,
        facialExpressions: 50,
        comfortTrend: 50,
      },
    };
  }

  const avgConfidence = average(snapshots.map((snapshot) => Number(snapshot?.confidence || 0)));
  const avgNervousness = average(snapshots.map((snapshot) => Number(snapshot?.nervousness || 0)));
  const avgEngagement = average(snapshots.map((snapshot) => Number(snapshot?.engagement || 0)));
  const avgEyeContact = average(snapshots.map((snapshot) => Number(snapshot?.eyeContact || 0)));
  const avgFacialSignal = average(
    snapshots.map((snapshot) => {
      const expressions = snapshot?.expressions || {};
      const positive = Number(expressions.happy || 0) + Number(expressions.neutral || 0) * 0.7;
      const negative = Number(expressions.fearful || 0) + Number(expressions.sad || 0) + Number(expressions.disgusted || 0);
      const signal = 0.5 + positive * 0.6 - negative * 0.5;
      return Math.max(0, Math.min(1, signal));
    })
  );

  const splitIndex = Math.max(1, Math.floor(snapshots.length / 3));
  const earlyNervousness = average(
    snapshots.slice(0, splitIndex).map((snapshot) => Number(snapshot?.nervousness || 0))
  );
  const lateNervousness = average(
    snapshots.slice(-splitIndex).map((snapshot) => Number(snapshot?.nervousness || 0))
  );
  const nervousnessImprovement = earlyNervousness - lateNervousness;

  const eyeContact = clampScore(avgEyeContact * 100, 50);
  const posture = clampScore((avgConfidence * 0.75 + (1 - avgNervousness) * 0.25) * 100, 50);
  const gestures = clampScore((avgEngagement * 0.75 + avgConfidence * 0.25) * 100, 50);
  const facialExpressions = clampScore(avgFacialSignal * 100, 50);
  const comfortTrend = clampScore(60 + nervousnessImprovement * 120 - avgNervousness * 20, 50);

  const nervousnessPenalty = avgNervousness > 0.6 ? 6 : 0;
  const overall = clampScore(
    eyeContact * 0.30
    + posture * 0.25
    + gestures * 0.20
    + facialExpressions * 0.15
    + comfortTrend * 0.10
    - nervousnessPenalty,
    50
  );

  return {
    overall,
    dimensions: {
      eyeContact,
      posture,
      gestures,
      facialExpressions,
      comfortTrend,
    },
  };
};

const scoreVoiceSpeech = ({
  transcript = [],
  languageSnapshots = [],
  liveVoiceScore = 70,
}) => {
  const answers = getUserAnswers(transcript);
  if (!answers.length) {
    return {
      overall: clampScore(liveVoiceScore, 70),
      dimensions: {
        tone: clampScore(liveVoiceScore, 70),
        pace: 70,
        wordChoice: 70,
        fillerControl: 70,
        articulation: 70,
      },
    };
  }

  const combinedText = answers.join(' ');
  const totalWords = Math.max(countWords(combinedText), 1);
  const totalSentences = Math.max(countSentences(combinedText), 1);
  const avgWordsPerSentence = totalWords / totalSentences;

  const fillersFromSnapshots = Array.isArray(languageSnapshots) && languageSnapshots.length
    ? languageSnapshots.reduce((sum, entry) => sum + Math.max(0, Number(entry?.fillers || 0)), 0)
    : (combinedText.match(FILLER_PATTERN) || []).length;
  const fillerRate = fillersFromSnapshots / totalWords;

  const vocabularyFromSnapshots = Array.isArray(languageSnapshots) && languageSnapshots.length
    ? average(languageSnapshots.map((entry) => Number(entry?.vocabulary || 0)))
    : clampScore(new Set(tokenizeKeywords(combinedText)).size / Math.max(totalWords, 1) * 500, 55);
  const clarityFromSnapshots = Array.isArray(languageSnapshots) && languageSnapshots.length
    ? average(languageSnapshots.map((entry) => Number(entry?.clarity || 0)))
    : 70;

  const tone = clampScore(liveVoiceScore, 70);
  const pace = clampScore(94 - Math.abs(avgWordsPerSentence - 16) * 3.8, 55);
  const wordChoice = clampScore(vocabularyFromSnapshots, 55);
  const fillerControl = clampScore(95 - fillerRate * 1450, 55);
  const articulation = clampScore(clarityFromSnapshots, 55);

  const overall = clampScore(
    tone * 0.35
    + pace * 0.20
    + articulation * 0.20
    + wordChoice * 0.15
    + fillerControl * 0.10,
    60
  );

  return {
    overall,
    dimensions: {
      tone,
      pace,
      wordChoice,
      fillerControl,
      articulation,
    },
  };
};

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
  return scoreBodyLanguageDetailed(snapshots).overall;
}

export function calculateFinalScore({
  transcript = [],
  languageSnapshots = [],
  bodySnapshots = [],
  voiceScore = 70,
}) {
  const contentResult = scoreContentAnswers({ transcript, languageSnapshots });
  const bodyResult = scoreBodyLanguageDetailed(bodySnapshots);
  const voiceResult = scoreVoiceSpeech({ transcript, languageSnapshots, liveVoiceScore: voiceScore });

  const content = contentResult.overall;
  const body = bodyResult.overall;
  const voice = voiceResult.overall;

  const weightedTotal = (
    content * RUBRIC_WEIGHTS.content
    + body * RUBRIC_WEIGHTS.body
    + voice * RUBRIC_WEIGHTS.voice
  );
  const overall = clampScore(weightedTotal / RUBRIC_WEIGHTS.normalizationBase, 50);

  return {
    content,
    body,
    voice,
    language: content,
    overall,
    breakdown: {
      weights: { ...RUBRIC_WEIGHTS },
      content: contentResult.dimensions,
      body: bodyResult.dimensions,
      voice: voiceResult.dimensions,
    },
  };
}
