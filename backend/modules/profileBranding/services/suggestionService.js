const axios = require('axios');

const TOOL_ORDER = ['Website', 'LinkedIn', 'GitHub'];
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };
const MAX_PER_TOOL = 3;
const MIN_PER_TOOL = 2;

const toText = (value) => String(value || '').trim();
const toLowerText = (value) => toText(value).toLowerCase();

const createVariantPicker = () => {
  let cursor = Date.now();

  return (variants) => {
    if (!Array.isArray(variants) || variants.length === 0) {
      return '';
    }

    cursor += 1;
    const index = Math.abs(cursor) % variants.length;
    return variants[index];
  };
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clampImpact = (value) => {
  const parsed = Math.round(toNumber(value, 1));
  return Math.max(1, Math.min(8, parsed));
};

const normalizeTool = (value) => {
  const lower = toLowerText(value);
  if (lower.includes('website')) return 'Website';
  if (lower.includes('github')) return 'GitHub';
  if (lower.includes('linkedin')) return 'LinkedIn';
  return '';
};

const normalizePriority = (value) => {
  const lower = toLowerText(value);
  if (lower === 'high' || lower === 'medium' || lower === 'low') {
    return lower;
  }
  return 'medium';
};

const mapCategory = (tool) => {
  if (tool === 'Website') return 'Personal Presence';
  return 'Professional Profile';
};

const createSuggestion = ({
  tool,
  priority,
  text,
  expectedScoreImpact,
  exampleRewrite,
}) => {
  const normalizedTool = normalizeTool(tool);
  if (!normalizedTool) {
    return null;
  }

  const actionText = toText(text);
  if (!actionText) {
    return null;
  }

  const normalizedPriority = normalizePriority(priority);
  const impactValue = clampImpact(expectedScoreImpact);
  const category = mapCategory(normalizedTool);

  return {
    category,
    tool: normalizedTool,
    priority: normalizedPriority,
    text: actionText,
    impact: `Expected +${impactValue} points in ${category}.`,
    expectedScoreImpact: impactValue,
    exampleRewrite: toText(exampleRewrite),
    completed: false,
    generatedAt: new Date(),
  };
};

const buildFallbackSuggestions = (profile) => {
  const linkedIn = profile?.linkedIn || {};
  const github = profile?.github || {};
  const website = profile?.personalWebsite || {};
  const pick = createVariantPicker();

  const linkedInHeadline = toText(linkedIn.headline);
  const linkedInAbout = toText(linkedIn.about || linkedIn.aboutSection);
  const linkedInSkillsCount = toNumber(linkedIn.skillsCount, Array.isArray(linkedIn.skills) ? linkedIn.skills.length : 0);
  const linkedInRecommendations = toNumber(linkedIn.recommendationsCount, 0);

  const githubRepos = toNumber(github.publicRepos, 0);
  const githubContributions = toNumber(github.contributionsLastYear, 0);

  const fallback = [
    createSuggestion({
      tool: 'Website',
      priority: website.url ? 'medium' : 'high',
      text: website.url
        ? pick([
          'Strengthen your homepage with a clear value proposition and one primary call-to-action.',
          'Refine your homepage hero so it explains who you help, how you help, and what action visitors should take.'
        ])
        : pick([
          'Publish a personal website with a homepage, about section, and portfolio starter page.',
          'Launch a simple personal site with Home, About, and Portfolio sections so recruiters can evaluate you quickly.'
        ]),
      expectedScoreImpact: website.url ? 2 : 6,
      exampleRewrite: website.url
        ? pick([
          'Hero copy example: "I help teams build reliable full-stack products with React, Node.js, and cloud automation." CTA: "View Portfolio".',
          'Hero copy example: "I design and ship scalable web products that improve conversion and performance." CTA: "See Case Studies".'
        ])
        : pick([
          'Homepage opening example: "Hi, I am [Name], a [Role] focused on [Domain]. Here are projects where I improved [Outcome]."',
          'Homepage opening example: "I am [Name], a [Role] who builds [type of solutions] to solve [problem] with measurable outcomes."'
        ]),
    }),
    createSuggestion({
      tool: 'Website',
      priority: website.hasPortfolio ? 'low' : 'high',
      text: website.hasPortfolio
        ? pick([
          'Add case-study structure to project pages: problem, approach, impact, and technologies.',
          'Restructure project pages into case studies so each one highlights challenge, decision-making, and measurable outcome.'
        ])
        : pick([
          'Add a dedicated portfolio page with 3 project case studies and measurable outcomes.',
          'Create a portfolio section with three high-impact projects and clear before/after metrics.'
        ]),
      expectedScoreImpact: website.hasPortfolio ? 2 : 5,
      exampleRewrite: pick([
        'Case study template: "Problem: [x]. Action: built [solution]. Result: improved [metric] by [y]%."',
        'Case study template: "Context: [team/problem]. Implementation: [approach + stack]. Outcome: [metric uplift]."'
      ]),
    }),
    createSuggestion({
      tool: 'Website',
      priority: website.hasBlog ? 'medium' : 'medium',
      text: website.hasBlog
        ? pick([
          'Increase publishing cadence to at least two high-quality posts per month.',
          'Publish more consistently by committing to one practical article every two weeks.'
        ])
        : pick([
          'Start a blog and publish practical, role-relevant posts that showcase expertise.',
          'Launch a blog and write implementation-focused posts that demonstrate your domain depth.'
        ]),
      expectedScoreImpact: 3,
      exampleRewrite: pick([
        'Blog title example: "How I optimized API response time by 42% with caching and query refactors".',
        'Blog title example: "From slow to scalable: lessons from redesigning a production search flow".'
      ]),
    }),
    createSuggestion({
      tool: 'LinkedIn',
      priority: linkedInHeadline ? 'medium' : 'high',
      text: linkedInHeadline
        ? pick([
          'Refine your LinkedIn headline to include role, niche, and outcomes.',
          'Tune your LinkedIn headline so it combines title, specialization, and business impact.'
        ])
        : pick([
          'Add a keyword-rich LinkedIn headline that states your role and value clearly.',
          'Write a focused LinkedIn headline that highlights your role, stack, and differentiator.'
        ]),
      expectedScoreImpact: linkedInHeadline ? 2 : 3,
      exampleRewrite: pick([
        'Headline example: "Software Engineer | Node.js + React | Building scalable web products with measurable business impact".',
        'Headline example: "Frontend Engineer | React + TypeScript | Improving product UX and conversion through data-driven iteration".'
      ]),
    }),
    createSuggestion({
      tool: 'LinkedIn',
      priority: linkedInAbout.length >= 280 ? 'low' : 'high',
      text: linkedInAbout.length >= 280
        ? pick([
          'Make your About section more outcome-driven with metrics and domain keywords.',
          'Improve your About section by replacing generic claims with concrete achievements and quantified results.'
        ])
        : pick([
          'Expand your About section with a concise story, core strengths, and quantifiable achievements.',
          'Grow your About section into a short narrative covering expertise, accomplishments, and target opportunities.'
        ]),
      expectedScoreImpact: linkedInAbout.length >= 280 ? 2 : 3,
      exampleRewrite: pick([
        'About opening example: "I am a [Role] with [X] years of experience delivering [Outcome]. Recently, I led [Project] that improved [Metric] by [Y]%."',
        'About opening example: "I build [type of solutions] for [audience]. Over the last [X] years, I have delivered [result] across [domain]."'
      ]),
    }),
    createSuggestion({
      tool: 'LinkedIn',
      priority: linkedInSkillsCount >= 10 ? 'low' : 'medium',
      text: linkedInSkillsCount >= 10
        ? pick([
          'Reorder your top skills to match the role you are targeting now.',
          'Reprioritize your top skills to mirror current job requirements in your target niche.'
        ])
        : pick([
          'Increase listed and validated skills to at least 10 and align them with your target role.',
          'Expand your skills list to at least 10 role-relevant skills and keep the strongest ones pinned at the top.'
        ]),
      expectedScoreImpact: 2,
      exampleRewrite: pick([
        'Top skills example: "System Design, React, Node.js, SQL, AWS, CI/CD, Performance Optimization, Testing, Leadership, Communication".',
        'Top skills example: "Product Strategy, UX Research, Figma, A/B Testing, SQL, Analytics, Stakeholder Communication, Roadmapping".'
      ]),
    }),
    createSuggestion({
      tool: 'LinkedIn',
      priority: linkedInRecommendations >= 3 ? 'low' : 'medium',
      text: linkedInRecommendations >= 3
        ? pick([
          'Refresh recommendation quality by requesting one recent recommendation tied to your latest work.',
          'Add one fresh recommendation from a recent collaborator to keep your profile credibility current.'
        ])
        : pick([
          'Request at least 3 recommendations focused on impact, reliability, and collaboration.',
          'Collect at least three recommendations that mention outcomes, ownership, and cross-team communication.'
        ]),
      expectedScoreImpact: 3,
      exampleRewrite: pick([
        'Recommendation ask template: "Could you share a 3-4 line recommendation highlighting project outcomes, ownership, and team collaboration?"',
        'Recommendation ask template: "Could you write a brief recommendation describing the results we achieved and how I contributed?"'
      ]),
    }),
    createSuggestion({
      tool: 'GitHub',
      priority: github.username ? 'medium' : 'high',
      text: github.username
        ? pick([
          'Curate your GitHub profile with pinned repositories that match your target role.',
          'Reorder pinned repositories so your best role-aligned work appears first.'
        ])
        : pick([
          'Create a GitHub profile and publish at least 3 repositories that demonstrate core skills.',
          'Set up your GitHub profile and push at least three projects that showcase your primary stack.'
        ]),
      expectedScoreImpact: github.username ? 2 : 4,
      exampleRewrite: pick([
        'Pinned repo note example: "Inventory API (Node.js + PostgreSQL) - reduced query latency by 38% via indexing and caching".',
        'Pinned repo note example: "Realtime Chat Platform (React + Socket.IO) - supported 5k concurrent users with resilient reconnect logic".'
      ]),
    }),
    createSuggestion({
      tool: 'GitHub',
      priority: github.hasReadme ? 'low' : 'medium',
      text: github.hasReadme
        ? pick([
          'Upgrade your profile README with focused sections for expertise, projects, and contact.',
          'Refresh your profile README with role focus, highlights, and direct links to your strongest repositories.'
        ])
        : pick([
          'Add a profile README with role summary, key projects, and technical strengths.',
          'Create a profile README that quickly communicates your focus, top projects, and preferred technologies.'
        ]),
      expectedScoreImpact: github.hasReadme ? 1 : 2,
      exampleRewrite: pick([
        'README opening example: "I build full-stack applications focused on performance, reliability, and clear developer experience."',
        'README opening example: "I am a backend engineer specializing in scalable APIs, data modeling, and production reliability."'
      ]),
    }),
    createSuggestion({
      tool: 'GitHub',
      priority: githubRepos >= 10 ? 'low' : 'medium',
      text: githubRepos >= 10
        ? pick([
          'Improve repository quality with better issue templates, docs, and release notes.',
          'Raise repository quality by standardizing documentation, contribution guides, and release summaries.'
        ])
        : pick([
          'Increase public repositories to at least 10 with complete README, setup steps, and screenshots.',
          'Build toward 10 public repositories and make each one production-ready with setup docs and architecture notes.'
        ]),
      expectedScoreImpact: githubRepos >= 10 ? 1 : 2,
      exampleRewrite: pick([
        'Repository README example: "Problem -> Solution -> Architecture -> Setup -> Results -> Next Improvements".',
        'Repository README example: "Why this project -> Key features -> Tech stack -> Local setup -> Demo -> Roadmap".'
      ]),
    }),
    createSuggestion({
      tool: 'GitHub',
      priority: githubContributions >= 100 ? 'low' : 'medium',
      text: githubContributions >= 100
        ? pick([
          'Sustain consistency by maintaining weekly commits on meaningful feature or maintenance work.',
          'Keep contribution momentum by shipping at least one meaningful improvement each week.'
        ])
        : pick([
          'Increase contribution consistency with weekly commits, pull requests, and issue updates.',
          'Improve your contribution graph by planning weekly commits, PRs, and issue triage.'
        ]),
      expectedScoreImpact: githubContributions >= 100 ? 1 : 2,
      exampleRewrite: pick([
        'Weekly plan example: "Mon: issue triage, Wed: feature branch commit, Fri: PR review and merge notes."',
        'Weekly plan example: "Tue: backlog cleanup, Thu: feature PR, Sat: documentation and changelog update."'
      ]),
    }),
  ].filter(Boolean);

  return fallback;
};

const parseJson = (text) => {
  const cleaned = toText(text).replace(/```json|```/gi, '').trim();
  if (!cleaned) return null;

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    // continue
  }

  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;

  try {
    return JSON.parse(match[0]);
  } catch (error) {
    return null;
  }
};

const getGeminiApiKey = () => toText(
  process.env.GEMINI_API_KEY
  || process.env.GOOGLE_GENERATIVE_AI_API_KEY
  || process.env.GOOGLE_API_KEY
);

const extractGeminiText = (data) => data?.candidates?.[0]?.content?.parts
  ?.map((part) => part?.text || '')
  .join('')
  .trim();

const buildPreviousSuggestionSummary = (profile) => {
  const grouped = {
    Website: [],
    LinkedIn: [],
    GitHub: [],
  };

  const previous = Array.isArray(profile?.suggestions) ? profile.suggestions : [];
  previous.forEach((item) => {
    const tool = normalizeTool(item?.tool);
    const text = toText(item?.text);

    if (!tool || !text) {
      return;
    }

    if (grouped[tool].length >= 6) {
      return;
    }

    grouped[tool].push(text);
  });

  return grouped;
};

const buildProfileSummary = (profile, scores) => ({
  scores: {
    total: toNumber(scores?.total, 0),
    personalPresence: toNumber(scores?.personalPresence, 0),
    professionalProfiles: toNumber(scores?.professionalProfiles, 0),
  },
  website: {
    url: Boolean(profile?.personalWebsite?.url),
    hasAboutPage: Boolean(profile?.personalWebsite?.hasAboutPage),
    hasPortfolio: Boolean(profile?.personalWebsite?.hasPortfolio),
    hasBlog: Boolean(profile?.personalWebsite?.hasBlog),
    hasContactPage: Boolean(profile?.personalWebsite?.hasContactPage),
    blogPostCount: toNumber(profile?.personalWebsite?.blogPostCount, 0),
  },
  linkedIn: {
    connected: Boolean(profile?.linkedIn?.profileUrl),
    hasHeadline: Boolean(toText(profile?.linkedIn?.headline)),
    aboutLength: toText(profile?.linkedIn?.about || profile?.linkedIn?.aboutSection).length,
    skillsCount: toNumber(profile?.linkedIn?.skillsCount, Array.isArray(profile?.linkedIn?.skills) ? profile.linkedIn.skills.length : 0),
    recommendationsCount: toNumber(profile?.linkedIn?.recommendationsCount, 0),
  },
  github: {
    connected: Boolean(profile?.github?.username),
    publicRepos: toNumber(profile?.github?.publicRepos, 0),
    contributionsLastYear: toNumber(profile?.github?.contributionsLastYear, 0),
    hasReadme: Boolean(profile?.github?.hasReadme),
    followers: toNumber(profile?.github?.followers, 0),
  },
  previousSuggestions: buildPreviousSuggestionSummary(profile),
});

const fetchGeminiSuggestions = async (profile, scores) => {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return [];

  const summary = buildProfileSummary(profile, scores);
  const runId = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
  const userPrompt = `Return ONLY JSON with this schema:
{
  "suggestions": [
    {
      "tool": "Website|LinkedIn|GitHub",
      "priority": "high|medium|low",
      "expectedScoreImpact": 1-8,
      "text": "one actionable recommendation",
      "exampleRewrite": "concrete rewrite example"
    }
  ]
}

Rules:
- Produce exactly 9 suggestions: 3 for Website, 3 for LinkedIn, 3 for GitHub.
- Keep each suggestion practical and directly tied to increasing profile branding score.
- expectedScoreImpact must be an integer.
- exampleRewrite must be specific and editable by the user.
- Use runId "${runId}" as a freshness signal and do not repeat prior suggestion wording from previousSuggestions.

Current profile summary:
${JSON.stringify(summary, null, 2)}`;

  try {
    const { data } = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent',
      {
        system_instruction: {
          parts: [
            {
              text: 'You are a profile branding coach. Provide score-improvement suggestions only for Website, LinkedIn, and GitHub.',
            },
          ],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 1200,
          thinkingConfig: {
            thinkingBudget: 0,
          },
        },
      },
      {
        headers: {
          'x-goog-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const responseText = extractGeminiText(data);
    const payload = parseJson(responseText);
    const rawSuggestions = Array.isArray(payload?.suggestions) ? payload.suggestions : [];

    return rawSuggestions
      .map((item) => createSuggestion({
        tool: item?.tool,
        priority: item?.priority,
        text: item?.text,
        expectedScoreImpact: item?.expectedScoreImpact,
        exampleRewrite: item?.exampleRewrite,
      }))
      .filter(Boolean);
  } catch (error) {
    return [];
  }
};

const sortSuggestions = (items) => [...items].sort((a, b) => {
  const byPriority = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
  if (byPriority !== 0) return byPriority;

  const byImpact = toNumber(b.expectedScoreImpact, 0) - toNumber(a.expectedScoreImpact, 0);
  if (byImpact !== 0) return byImpact;

  return a.tool.localeCompare(b.tool);
});

const dedupeSuggestions = (items) => {
  const seen = new Set();
  const unique = [];

  items.forEach((item) => {
    const key = `${item.tool}|${item.text.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    unique.push(item);
  });

  return unique;
};

const mergeGeminiAndFallback = (geminiSuggestions, fallbackSuggestions) => {
  const grouped = new Map();
  TOOL_ORDER.forEach((tool) => grouped.set(tool, []));

  const pushIfRoom = (item) => {
    const bucket = grouped.get(item.tool);
    if (!bucket) return;
    if (bucket.length >= MAX_PER_TOOL) return;
    bucket.push(item);
  };

  dedupeSuggestions(geminiSuggestions).forEach(pushIfRoom);

  TOOL_ORDER.forEach((tool) => {
    if ((grouped.get(tool) || []).length >= MIN_PER_TOOL) {
      return;
    }

    fallbackSuggestions
      .filter((item) => item.tool === tool)
      .forEach(pushIfRoom);
  });

  TOOL_ORDER.forEach((tool) => {
    fallbackSuggestions
      .filter((item) => item.tool === tool)
      .forEach(pushIfRoom);
  });

  const merged = TOOL_ORDER.flatMap((tool) => sortSuggestions(grouped.get(tool) || []));
  return dedupeSuggestions(merged);
};

exports.generateSuggestions = async (profile, scores) => {
  const fallbackSuggestions = buildFallbackSuggestions(profile);
  const geminiSuggestions = await fetchGeminiSuggestions(profile, scores);
  return mergeGeminiAndFallback(geminiSuggestions, fallbackSuggestions);
};
