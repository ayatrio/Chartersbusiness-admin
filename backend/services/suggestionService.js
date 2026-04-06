// Generate rule-based improvement suggestions
const getNetworkingFollowersCount = (networking = {}, linkedIn = {}) => (
  networking?.followersCount ?? networking?.connectionsCount ?? linkedIn?.connectionsCount ?? 0
);

const getNetworkingPostsCount = (networking = {}) => (
  networking?.postsLast60Days ?? networking?.postsShared ?? 0
);

const getNetworkingLongFormArticles = (networking = {}) => (
  networking?.longFormArticles ?? networking?.articlesPublished ?? 0
);

exports.generateSuggestions = (profile, scores) => {
  const suggestions = [];

  // ─── Personal Presence Suggestions ───────────────────────────
  if (!profile.personalWebsite?.url) {
    suggestions.push({
      category: 'Personal Presence',
      priority: 'high',
      text: 'Create a personal website to showcase your work and personality.',
      impact: 'Can add up to 18 points to your Personal Presence score.'
    });
  } else {
    if (!profile.personalWebsite.hasPortfolio) {
      suggestions.push({
        category: 'Personal Presence',
        priority: 'high',
        text: 'Add a dedicated portfolio/projects page to your website.',
        impact: 'Adds 5 points to your Personal Presence score.'
      });
    }
    if (!profile.personalWebsite.hasBlog) {
      suggestions.push({
        category: 'Personal Presence',
        priority: 'medium',
        text: 'Start a blog on your website to share knowledge and insights.',
        impact: 'Adds up to 7 points across Personal Presence and Thought Leadership.'
      });
    }
    if (!profile.personalWebsite.hasAboutPage) {
      suggestions.push({
        category: 'Personal Presence',
        priority: 'medium',
        text: 'Add an About page to your website with your story and background.',
        impact: 'Adds 3 points to your Personal Presence score.'
      });
    }
    if ((profile.personalWebsite.blogPostCount || 0) < 5 && profile.personalWebsite.hasBlog) {
      suggestions.push({
        category: 'Personal Presence',
        priority: 'medium',
        text: 'Publish at least 5 blog posts. Aim for one post every 2 weeks.',
        impact: 'Adds 3 points to your Personal Presence score.'
      });
    }
  }

  if (!profile.profilePicture?.isProfessional) {
    suggestions.push({
      category: 'Personal Presence',
      priority: 'high',
      text: 'Upload a professional headshot as your profile picture across all platforms.',
      impact: 'Adds 3 points and significantly improves recruiter first impressions.'
    });
  }

  // ─── Professional Profile Suggestions ────────────────────────
  if (!profile.linkedIn?.profileUrl) {
    suggestions.push({
      category: 'Professional Profile',
      priority: 'high',
      text: 'Create and complete your LinkedIn profile.',
      impact: 'Can add up to 17 points to your Professional Profiles score.'
    });
  } else {
    if (!profile.linkedIn.hasHeadline) {
      suggestions.push({
        category: 'Professional Profile',
        priority: 'high',
        text: 'Add a compelling LinkedIn headline that reflects your expertise and value.',
        impact: 'Adds 2 points and improves discoverability in LinkedIn searches.'
      });
    }
    if ((profile.linkedIn.aboutSectionLength || 0) < 300) {
      suggestions.push({
        category: 'Professional Profile',
        priority: 'high',
        text: 'Expand your LinkedIn About section to at least 300 characters. Include achievements and keywords.',
        impact: 'Adds 3 points and significantly boosts LinkedIn search ranking.'
      });
    }
    if ((profile.linkedIn.skillsCount || 0) < 10) {
      suggestions.push({
        category: 'Professional Profile',
        priority: 'medium',
        text: `Add more skills to LinkedIn. You currently have ${profile.linkedIn.skillsCount || 0} — aim for at least 10.`,
        impact: 'Adds 2 points and improves profile completeness.'
      });
    }
    if ((profile.linkedIn.recommendationsCount || 0) < 3) {
      suggestions.push({
        category: 'Professional Profile',
        priority: 'medium',
        text: 'Request at least 3 LinkedIn recommendations from colleagues or managers.',
        impact: 'Adds 3 points — one of the highest-impact improvements you can make.'
      });
    }
  }

  if (!profile.github?.username) {
    suggestions.push({
      category: 'Professional Profile',
      priority: 'medium',
      text: 'Create a GitHub profile and start publishing your code projects.',
      impact: 'Can add up to 8 points to your Professional Profiles score.'
    });
  } else {
    if (!profile.github.hasReadme) {
      suggestions.push({
        category: 'Professional Profile',
        priority: 'medium',
        text: 'Create a GitHub profile README (a repo named same as your username) to introduce yourself.',
        impact: 'Adds 1 point and makes a great first impression on your GitHub profile.'
      });
    }
    if ((profile.github.publicRepos || 0) < 10) {
      suggestions.push({
        category: 'Professional Profile',
        priority: 'medium',
        text: `You have ${profile.github.publicRepos || 0} public repositories. Aim to publish at least 10 projects.`,
        impact: 'Adds 2 points to your Professional Profiles score.'
      });
    }
    if ((profile.github.contributionsLastYear || 0) < 100) {
      suggestions.push({
        category: 'Professional Profile',
        priority: 'low',
        text: 'Increase your GitHub contributions. Try to commit code consistently — even small updates count.',
        impact: 'Adds 2 points and shows active development habits to recruiters.'
      });
    }
  }

  // ─── Networking Suggestions ───────────────────────────────────
  const networkingPlatform = profile.networking?.platform || 'your strongest social or blogging platform';
  const followersCount = getNetworkingFollowersCount(profile.networking, profile.linkedIn);
  const postsLast60Days = getNetworkingPostsCount(profile.networking);
  const longFormArticles = getNetworkingLongFormArticles(profile.networking);

  if (followersCount < 100) {
    suggestions.push({
      category: 'Networking',
      priority: 'high',
      text: `Grow your audience on ${networkingPlatform} to at least 100 followers or connections.`,
      impact: 'Adds up to 4 points to your Networking score.'
    });
  } else if (followersCount < 300) {
    suggestions.push({
      category: 'Networking',
      priority: 'medium',
      text: `Keep expanding your reach on ${networkingPlatform} to 300+ followers or connections for stronger visibility.`,
      impact: 'Adds 2 more points to your Networking score.'
    });
  }

  if ((profile.networking?.groupsJoined || 0) < 5) {
    suggestions.push({
      category: 'Networking',
      priority: 'low',
      text: 'Join at least 5 relevant communities, groups, or circles in your niche.',
      impact: 'Adds 3 points and helps your content reach more of the right audience.'
    });
  }

  if (postsLast60Days < 10) {
    suggestions.push({
      category: 'Networking',
      priority: 'medium',
      text: `Create or share at least 10 posts in the last 60 days on ${networkingPlatform}.`,
      impact: 'Adds 3 points and keeps your social presence active and visible.'
    });
  }

  if (longFormArticles < 3) {
    suggestions.push({
      category: 'Networking',
      priority: 'medium',
      text: 'Publish at least 3 long-form articles or deep-dive posts to build authority.',
      impact: 'Adds 4 points and strengthens your expertise signal.'
    });
  }

  if ((profile.networking?.engagementRate || 0) < 5) {
    suggestions.push({
      category: 'Networking',
      priority: 'low',
      text: 'Improve your average engagement rate to 5%+ by using stronger hooks, visuals, and calls to action.',
      impact: 'Adds 2 points and shows your content is resonating with the audience.'
    });
  }

  // ─── Credentials Suggestions ──────────────────────────────────
  const certCount = profile.certifications?.length || 0;
  if (certCount === 0) {
    suggestions.push({
      category: 'Credentials',
      priority: 'high',
      text: 'Earn your first certification. Start with free options like Google, AWS Free Tier, or Coursera audit courses.',
      impact: 'Adds 3 points immediately and validates your technical skills.'
    });
  } else if (certCount < 3) {
    suggestions.push({
      category: 'Credentials',
      priority: 'medium',
      text: `You have ${certCount} certification(s). Earn at least 3 to maximize your Credentials score.`,
      impact: 'Adds up to 5 points to your Credentials score.'
    });
  }

  const courseCount = profile.courses?.length || 0;
  if (courseCount < 3) {
    suggestions.push({
      category: 'Credentials',
      priority: 'medium',
      text: 'Complete online courses on platforms like Coursera, Udemy, or LinkedIn Learning and add them to your profile.',
      impact: 'Adds up to 4 points to your Credentials score.'
    });
  }

  // ─── Thought Leadership Suggestions ──────────────────────────
  const pubCount = profile.publications?.length || 0;
  if (pubCount === 0) {
    suggestions.push({
      category: 'Thought Leadership',
      priority: 'medium',
      text: 'Publish your first article on LinkedIn, Medium, or Dev.to about something you have learned or built.',
      impact: 'Adds 2 points and establishes your voice in the industry.'
    });
  } else if (pubCount < 3) {
    suggestions.push({
      category: 'Thought Leadership',
      priority: 'low',
      text: 'Keep writing. Aim for at least 3 published articles to strengthen your thought leadership.',
      impact: 'Adds 1 more point and builds long-term credibility.'
    });
  }

  // Sort: high → medium → low
  if (!profile.youtube?.channelUrl) {
    suggestions.push({
      category: 'Thought Leadership',
      priority: 'low',
      text: 'Add your YouTube channel and publish videos aligned with your selected course topics.',
      impact: 'Can contribute up to 3 points to your Thought Leadership score.'
    });
  } else {
    if ((profile.youtube?.averageRelevanceScore || 0) < 45) {
      suggestions.push({
        category: 'Thought Leadership',
        priority: 'medium',
        text: 'Make your recent YouTube video titles more aligned with your selected course themes and keywords.',
        impact: 'Improves your YouTube title relevance score by up to 5 points.'
      });
    }
    if ((profile.youtube?.totalVideos || 0) < 8) {
      suggestions.push({
        category: 'Thought Leadership',
        priority: 'low',
        text: 'Grow your YouTube library to at least 8 course-relevant videos.',
        impact: 'Adds up to 2 points to your YouTube activity score.'
      });
    }
  }

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return suggestions;
};
